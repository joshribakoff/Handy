//! Operation lock - prevents concurrent operations.
//!
//! This is a minimal concurrency gate: only one operation can run at a time.
//! The lock is held from when recording starts until transcription completes.
//!
//! # Current Scope (PR 1)
//!
//! - Global lock that prevents starting a new operation if one is in progress
//! - Phase tracking (Recording/Processing) for UI and cancel behavior
//! - Pure state machine with no side effects - easy to test
//! - Wired into actions.rs which still directly calls the managers
//!
//! # Future Work (PR 2)
//!
//! - OperationController becomes a facade that owns RecordingManager and
//!   TranscriptionManager
//! - Manager interfaces allow mock injection for integration testing
//! - Tests can verify: "if recording fails, lock releases"
//! - Could use permit/guard pattern for automatic cleanup on Drop
//!
//! # Usage
//!
//! ```ignore
//! // Try to start an operation
//! if let Err(reason) = controller.begin() {
//!     // Already busy - blocked
//!     return;
//! }
//!
//! // Do side effects...
//! if !audio.start_recording() {
//!     controller.abort(); // Release lock on failure
//!     return;
//! }
//!
//! // Later, transition to processing
//! controller.advance();
//!
//! // When transcription completes
//! controller.complete();
//! ```
//!
//! # Related Issues
//!
//! - #641: App crashes when push-to-talk hit twice in a row
//! - #462: Race -> crash on rapid toggle

use serde::Serialize;
use std::sync::Mutex;

/// Why an operation couldn't start.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BusyReason {
    Recording,
    Processing,
}

/// Phase within an operation lifecycle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum OperationPhase {
    /// No operation in progress. Lock available.
    Idle,
    /// Recording audio.
    Recording,
    /// Transcribing and processing.
    Processing,
}

impl Default for OperationPhase {
    fn default() -> Self {
        OperationPhase::Idle
    }
}

/// Holds the operation lock and tracks current phase.
///
/// Only one operation can run at a time. The lock is held from
/// when recording starts until transcription completes.
pub struct OperationController {
    phase: Mutex<OperationPhase>,
}

impl OperationController {
    pub fn new() -> Self {
        Self {
            phase: Mutex::new(OperationPhase::default()),
        }
    }

    /// Try to start an operation. Returns Ok if lock acquired, Err if busy.
    ///
    /// On success, state becomes Recording. Caller should then perform
    /// side effects. If side effects fail, call `abort()`.
    pub fn begin(&self) -> Result<(), BusyReason> {
        let mut phase = self.phase.lock().unwrap();
        match *phase {
            OperationPhase::Idle => {
                *phase = OperationPhase::Recording;
                Ok(())
            }
            OperationPhase::Recording => Err(BusyReason::Recording),
            OperationPhase::Processing => Err(BusyReason::Processing),
        }
    }

    /// Transition from Recording to Processing.
    ///
    /// Returns Err if not currently recording.
    pub fn advance(&self) -> Result<(), BusyReason> {
        let mut phase = self.phase.lock().unwrap();
        match *phase {
            OperationPhase::Recording => {
                *phase = OperationPhase::Processing;
                Ok(())
            }
            OperationPhase::Idle => Err(BusyReason::Recording), // Not recording
            OperationPhase::Processing => Err(BusyReason::Processing),
        }
    }

    /// Complete the operation and release the lock.
    ///
    /// Safe to call from any state - resets to Idle.
    pub fn complete(&self) {
        let mut phase = self.phase.lock().unwrap();
        *phase = OperationPhase::Idle;
    }

    /// Force release the lock. Used for cancellation or error recovery.
    /// Alias for complete().
    pub fn abort(&self) {
        self.complete();
    }

    /// Check if an operation is in progress.
    pub fn is_busy(&self) -> bool {
        !matches!(*self.phase.lock().unwrap(), OperationPhase::Idle)
    }

    /// Get current phase (for UI/debugging).
    pub fn current_phase(&self) -> OperationPhase {
        self.phase.lock().unwrap().clone()
    }
}

impl Default for OperationController {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_idle() {
        let c = OperationController::new();
        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(!c.is_busy());
    }

    #[test]
    fn lifecycle() {
        let c = OperationController::new();

        // Start -> Recording
        assert!(c.begin().is_ok());
        assert_eq!(c.current_phase(), OperationPhase::Recording);
        assert!(c.is_busy());

        // Can't start again while busy
        assert!(c.begin().is_err());

        // Advance -> Processing
        assert!(c.advance().is_ok());
        assert_eq!(c.current_phase(), OperationPhase::Processing);
        assert!(c.is_busy());

        // Complete -> Idle
        c.complete();
        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(!c.is_busy());

        // Can start again
        assert!(c.begin().is_ok());
    }

    #[test]
    fn abort_releases_lock() {
        let c = OperationController::new();

        c.begin().unwrap();
        assert!(c.is_busy());

        c.abort();
        assert!(!c.is_busy());

        // Can start again
        assert!(c.begin().is_ok());
    }

    #[test]
    fn complete_is_idempotent() {
        let c = OperationController::new();

        // Complete from Idle is fine
        c.complete();
        assert_eq!(c.current_phase(), OperationPhase::Idle);

        // Multiple completes are fine
        c.begin().unwrap();
        c.advance().unwrap();
        c.complete();
        c.complete();
        assert_eq!(c.current_phase(), OperationPhase::Idle);
    }

    #[test]
    fn thread_safety() {
        use std::sync::Arc;
        use std::thread;

        let c = Arc::new(OperationController::new());

        // 10 threads race to start
        let handles: Vec<_> = (0..10)
            .map(|_| {
                let c = Arc::clone(&c);
                thread::spawn(move || c.begin().is_ok())
            })
            .collect();

        let successes: Vec<bool> = handles.into_iter().map(|h| h.join().unwrap()).collect();

        // Exactly one wins
        assert_eq!(successes.iter().filter(|&&s| s).count(), 1);
    }

    // --- Integration-style tests ---

    #[test]
    fn hardware_failure_releases_lock() {
        let c = OperationController::new();

        c.begin().unwrap();

        // Hardware fails
        let hardware_ok = false;
        if !hardware_ok {
            c.abort();
        }

        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn blocked_during_recording() {
        let c = OperationController::new();

        c.begin().unwrap();

        let result = c.begin();
        assert!(matches!(result, Err(BusyReason::Recording)));
    }

    #[test]
    fn blocked_during_processing() {
        let c = OperationController::new();

        c.begin().unwrap();
        c.advance().unwrap();

        let result = c.begin();
        assert!(matches!(result, Err(BusyReason::Processing)));
    }

    #[test]
    fn full_success() {
        let c = OperationController::new();

        c.begin().unwrap();
        c.advance().unwrap();
        c.complete();

        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn cancel_during_recording() {
        let c = OperationController::new();

        c.begin().unwrap();
        c.abort();

        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn cancel_during_processing() {
        let c = OperationController::new();

        c.begin().unwrap();
        c.advance().unwrap();
        c.abort();

        assert_eq!(c.current_phase(), OperationPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn async_completion() {
        use std::sync::Arc;
        use std::thread;

        let c = Arc::new(OperationController::new());

        c.begin().unwrap();
        c.advance().unwrap();

        let c2 = Arc::clone(&c);
        let handle = thread::spawn(move || {
            // Transcription happens...
            c2.complete();
        });

        handle.join().unwrap();

        assert_eq!(c.current_phase(), OperationPhase::Idle);
    }

    #[test]
    fn rapid_double_tap() {
        use std::sync::Arc;
        use std::thread;
        use std::time::Duration;

        let c = Arc::new(OperationController::new());

        let c1 = Arc::clone(&c);
        let h1 = thread::spawn(move || c1.begin().is_ok());

        thread::sleep(Duration::from_micros(100));

        let c2 = Arc::clone(&c);
        let h2 = thread::spawn(move || c2.begin().is_ok());

        let first = h1.join().unwrap();
        let second = h2.join().unwrap();

        // Exactly one succeeds
        assert!(first && !second || !first && second);
    }
}
