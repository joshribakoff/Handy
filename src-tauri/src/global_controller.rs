//! Global Controller - prevents concurrent user operations.
//!
//! # PR 1: Global Lock (Pragmatic Fix)
//!
//! Minimal concurrency gate: only one operation runs at a time.
//! When user triggers hotkey, we acquire lock. Lock held until
//! transcription completes or operation cancelled.
//!
//! Yes, this "cripples" the app by preventing concurrent operations. But:
//! - Fixes crash bugs (#641, #462) caused by race conditions
//! - Small, testable abstraction (13 unit tests)
//! - Shows we can add tests while fixing issues
//! - Stepping stone to robust solution
//!
//! # PR 2: Global Controller with Manager Injection (Robust Fix)
//!
//! Future PR builds on this foundation:
//!
//! ```ignore
//! // GlobalController owns the managers
//! let controller = GlobalController::new(
//!     Box::new(real_recorder),
//!     Box::new(real_transcriber),
//! );
//!
//! // In tests, inject mocks:
//! let controller = GlobalController::new(
//!     Box::new(MockRecorder::that_fails_on_start()),
//!     Box::new(MockTranscriber::new()),
//! );
//! controller.begin();
//! assert!(!controller.is_busy()); // lock released on failure
//! ```
//!
//! Enables true integration testing: verify recording failures release
//! lock, transcription errors clean up properly, etc.
//!
//! # Usage (Current PR)
//!
//! ```ignore
//! if let Err(reason) = controller.begin() {
//!     return; // blocked - another operation in progress
//! }
//!
//! if !audio.start_recording() {
//!     controller.abort(); // release lock on failure
//!     return;
//! }
//!
//! // ... user speaks ...
//! controller.advance(); // Recording → Processing
//! // ... transcription runs async ...
//! controller.complete(); // release lock
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
pub enum GlobalPhase {
    Idle,
    Recording,
    Processing,
}

impl Default for GlobalPhase {
    fn default() -> Self {
        GlobalPhase::Idle
    }
}

/// Global lock ensuring only one operation runs at a time.
///
/// PR 1 (this): Just a mutex-protected state machine. Doesn't own
/// managers or do I/O. Just tracks busy state and phase.
///
/// PR 2 (future): Owns recording/transcription managers, enabling
/// mock injection for integration tests.
pub struct GlobalController {
    phase: Mutex<GlobalPhase>,
}

impl GlobalController {
    pub fn new() -> Self {
        Self {
            phase: Mutex::new(GlobalPhase::default()),
        }
    }

    /// Try to start an operation. Returns Ok if lock acquired, Err if busy.
    pub fn begin(&self) -> Result<(), BusyReason> {
        let mut phase = self.phase.lock().unwrap();
        match *phase {
            GlobalPhase::Idle => {
                *phase = GlobalPhase::Recording;
                Ok(())
            }
            GlobalPhase::Recording => Err(BusyReason::Recording),
            GlobalPhase::Processing => Err(BusyReason::Processing),
        }
    }

    /// Transition from Recording to Processing.
    pub fn advance(&self) -> Result<(), BusyReason> {
        let mut phase = self.phase.lock().unwrap();
        match *phase {
            GlobalPhase::Recording => {
                *phase = GlobalPhase::Processing;
                Ok(())
            }
            GlobalPhase::Idle => Err(BusyReason::Recording),
            GlobalPhase::Processing => Err(BusyReason::Processing),
        }
    }

    /// Complete operation and release lock.
    pub fn complete(&self) {
        *self.phase.lock().unwrap() = GlobalPhase::Idle;
    }

    /// Force release lock. For cancellation or error recovery.
    pub fn abort(&self) {
        self.complete();
    }

    /// Check if an operation is in progress.
    pub fn is_busy(&self) -> bool {
        !matches!(*self.phase.lock().unwrap(), GlobalPhase::Idle)
    }

    /// Get current phase (for UI/debugging).
    pub fn current_phase(&self) -> GlobalPhase {
        self.phase.lock().unwrap().clone()
    }
}

impl Default for GlobalController {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_idle() {
        let c = GlobalController::new();
        assert_eq!(c.current_phase(), GlobalPhase::Idle);
        assert!(!c.is_busy());
    }

    #[test]
    fn lifecycle() {
        let c = GlobalController::new();

        assert!(c.begin().is_ok());
        assert_eq!(c.current_phase(), GlobalPhase::Recording);
        assert!(c.is_busy());

        assert!(c.begin().is_err()); // blocked

        assert!(c.advance().is_ok());
        assert_eq!(c.current_phase(), GlobalPhase::Processing);

        c.complete();
        assert_eq!(c.current_phase(), GlobalPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn abort_releases_lock() {
        let c = GlobalController::new();
        c.begin().unwrap();
        c.abort();
        assert!(!c.is_busy());
        assert!(c.begin().is_ok());
    }

    #[test]
    fn complete_is_idempotent() {
        let c = GlobalController::new();
        c.complete(); // from Idle
        c.begin().unwrap();
        c.advance().unwrap();
        c.complete();
        c.complete();
        assert_eq!(c.current_phase(), GlobalPhase::Idle);
    }

    #[test]
    fn thread_safety_one_winner() {
        use std::sync::Arc;
        use std::thread;

        let c = Arc::new(GlobalController::new());
        let handles: Vec<_> = (0..10)
            .map(|_| {
                let c = Arc::clone(&c);
                thread::spawn(move || c.begin().is_ok())
            })
            .collect();

        let successes: Vec<bool> = handles.into_iter().map(|h| h.join().unwrap()).collect();
        assert_eq!(successes.iter().filter(|&&s| s).count(), 1);
    }

    #[test]
    fn hardware_failure_releases_lock() {
        let c = GlobalController::new();
        c.begin().unwrap();
        let hardware_ok = false;
        if !hardware_ok {
            c.abort();
        }
        assert_eq!(c.current_phase(), GlobalPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn blocked_during_recording() {
        let c = GlobalController::new();
        c.begin().unwrap();
        assert!(matches!(c.begin(), Err(BusyReason::Recording)));
    }

    #[test]
    fn blocked_during_processing() {
        let c = GlobalController::new();
        c.begin().unwrap();
        c.advance().unwrap();
        assert!(matches!(c.begin(), Err(BusyReason::Processing)));
    }

    #[test]
    fn full_success_flow() {
        let c = GlobalController::new();
        c.begin().unwrap();
        c.advance().unwrap();
        c.complete();
        assert_eq!(c.current_phase(), GlobalPhase::Idle);
        assert!(c.begin().is_ok());
    }

    #[test]
    fn cancel_during_recording() {
        let c = GlobalController::new();
        c.begin().unwrap();
        c.abort();
        assert!(c.begin().is_ok());
    }

    #[test]
    fn cancel_during_processing() {
        let c = GlobalController::new();
        c.begin().unwrap();
        c.advance().unwrap();
        c.abort();
        assert!(c.begin().is_ok());
    }

    #[test]
    fn async_task_completion() {
        use std::sync::Arc;
        use std::thread;

        let c = Arc::new(GlobalController::new());
        c.begin().unwrap();
        c.advance().unwrap();

        let c2 = Arc::clone(&c);
        thread::spawn(move || c2.complete()).join().unwrap();

        assert_eq!(c.current_phase(), GlobalPhase::Idle);
    }

    #[test]
    fn rapid_double_tap() {
        use std::sync::Arc;
        use std::thread;
        use std::time::Duration;

        let c = Arc::new(GlobalController::new());

        let c1 = Arc::clone(&c);
        let h1 = thread::spawn(move || c1.begin().is_ok());
        thread::sleep(Duration::from_micros(100));
        let c2 = Arc::clone(&c);
        let h2 = thread::spawn(move || c2.begin().is_ok());

        let (first, second) = (h1.join().unwrap(), h2.join().unwrap());
        assert!(first && !second || !first && second);
    }
}
