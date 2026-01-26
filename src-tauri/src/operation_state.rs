//! Operation lock with phase tracking.
//!
//! Prevents concurrent operations by holding a lock for the entire lifecycle
//! (hotkey press → transcription complete → paste). The state tracks which
//! phase we're in within that locked operation.
//!
//! # Usage
//!
//! ```ignore
//! // Try to start an operation
//! match controller.maybe_start_recording() {
//!     Ok(()) => {
//!         // Lock acquired, state is Recording
//!         // Now perform side effects...
//!         if !audio.start_recording() {
//!             controller.reset_to_idle(); // Release lock on failure
//!             return;
//!         }
//!     }
//!     Err(current_state) => {
//!         // Operation already in progress, blocked
//!         return;
//!     }
//! }
//! ```
//!
//! # Related Issues
//!
//! - #641: App crashes when push-to-talk hit twice in a row
//! - #462: Race -> crash on rapid toggle

use serde::Serialize;
use std::sync::Mutex;

/// Phase within an operation lifecycle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum OperationState {
    /// No operation in progress. Lock available.
    Idle,
    /// Recording audio.
    Recording,
    /// Transcribing and processing.
    Processing,
}

impl Default for OperationState {
    fn default() -> Self {
        OperationState::Idle
    }
}

/// Holds the operation lock and tracks current phase.
///
/// Only one operation can run at a time. The lock is held from
/// when recording starts until transcription completes.
pub struct OperationController {
    state: Mutex<OperationState>,
}

impl OperationController {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(OperationState::default()),
        }
    }

    /// Try to start an operation. Returns Ok if lock acquired, Err if busy.
    ///
    /// On success, state becomes Recording. Caller should then perform
    /// side effects. If side effects fail, call `reset_to_idle()`.
    pub fn maybe_start_recording(&self) -> Result<(), OperationState> {
        let mut state = self.state.lock().unwrap();
        match *state {
            OperationState::Idle => {
                *state = OperationState::Recording;
                Ok(())
            }
            ref other => Err(other.clone()),
        }
    }

    /// Transition from Recording to Processing.
    ///
    /// Returns Err if not currently recording.
    pub fn stop_recording(&self) -> Result<(), OperationState> {
        let mut state = self.state.lock().unwrap();
        match *state {
            OperationState::Recording => {
                *state = OperationState::Processing;
                Ok(())
            }
            ref other => Err(other.clone()),
        }
    }

    /// Complete the operation and release the lock.
    ///
    /// Idempotent - safe to call multiple times.
    pub fn complete(&self) {
        let mut state = self.state.lock().unwrap();
        if matches!(*state, OperationState::Processing) {
            *state = OperationState::Idle;
        }
    }

    /// Force release the lock. Used for cancellation or error recovery.
    pub fn reset_to_idle(&self) {
        let mut state = self.state.lock().unwrap();
        *state = OperationState::Idle;
    }

    /// Check if an operation is in progress.
    pub fn is_busy(&self) -> bool {
        !matches!(*self.state.lock().unwrap(), OperationState::Idle)
    }

    /// Get current phase (for UI/debugging).
    pub fn current_state(&self) -> OperationState {
        self.state.lock().unwrap().clone()
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
        assert_eq!(c.current_state(), OperationState::Idle);
        assert!(!c.is_busy());
    }

    #[test]
    fn lifecycle() {
        let c = OperationController::new();

        // Start -> Recording
        assert!(c.maybe_start_recording().is_ok());
        assert_eq!(c.current_state(), OperationState::Recording);
        assert!(c.is_busy());

        // Can't start again while busy
        assert!(c.maybe_start_recording().is_err());

        // Stop -> Processing
        assert!(c.stop_recording().is_ok());
        assert_eq!(c.current_state(), OperationState::Processing);
        assert!(c.is_busy());

        // Complete -> Idle
        c.complete();
        assert_eq!(c.current_state(), OperationState::Idle);
        assert!(!c.is_busy());

        // Can start again
        assert!(c.maybe_start_recording().is_ok());
    }

    #[test]
    fn reset_releases_lock() {
        let c = OperationController::new();

        c.maybe_start_recording().unwrap();
        assert!(c.is_busy());

        c.reset_to_idle();
        assert!(!c.is_busy());

        // Can start again
        assert!(c.maybe_start_recording().is_ok());
    }

    #[test]
    fn complete_is_idempotent() {
        let c = OperationController::new();

        // Complete from Idle is no-op
        c.complete();
        assert_eq!(c.current_state(), OperationState::Idle);

        // Multiple completes are fine
        c.maybe_start_recording().unwrap();
        c.stop_recording().unwrap();
        c.complete();
        c.complete();
        assert_eq!(c.current_state(), OperationState::Idle);
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
                thread::spawn(move || c.maybe_start_recording().is_ok())
            })
            .collect();

        let successes: Vec<bool> = handles.into_iter().map(|h| h.join().unwrap()).collect();

        // Exactly one wins
        assert_eq!(successes.iter().filter(|&&s| s).count(), 1);
    }
}
