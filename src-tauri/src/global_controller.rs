//! Global lock preventing concurrent operations.
//!
//! # PR 1: Pragmatic Fix
//!
//! Simple mutex. Acquire on start, release on complete/cancel/error.
//! Fixes crash from rapid hotkey presses (#641, #462).
//!
//! # Limitations
//!
//! This lock must be correctly wired into every code path in actions.rs.
//! If any path forgets to release the lock, the app gets stuck.
//! We can't meaningfully test this here - we'd just be testing that
//! the mutex works, which Rust already guarantees.
//!
//! # PR 2: Testable Fix
//!
//! GlobalController owns recorder/transcriber via traits. Tests inject
//! mocks to verify lock release on every code path:
//!
//! ```ignore
//! let controller = GlobalController::new(
//!     Box::new(MockRecorder::that_fails_on_start()),
//!     Box::new(MockTranscriber::new()),
//! );
//! controller.start_operation().await;
//! assert!(!controller.is_busy()); // proves lock released on failure
//! ```

use serde::Serialize;
use std::sync::Mutex;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BusyReason {
    Recording,
    Processing,
}

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

/// Global lock. Only one operation at a time.
pub struct GlobalController {
    phase: Mutex<GlobalPhase>,
}

impl GlobalController {
    pub fn new() -> Self {
        Self {
            phase: Mutex::new(GlobalPhase::default()),
        }
    }

    /// Acquire lock. Returns Err if already busy.
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

    /// Transition Recording → Processing.
    pub fn advance(&self) -> Result<(), BusyReason> {
        let mut phase = self.phase.lock().unwrap();
        match *phase {
            GlobalPhase::Recording => {
                *phase = GlobalPhase::Processing;
                Ok(())
            }
            _ => Err(BusyReason::Processing),
        }
    }

    /// Release lock.
    pub fn complete(&self) {
        *self.phase.lock().unwrap() = GlobalPhase::Idle;
    }

    /// Release lock (alias for cancel/error paths).
    pub fn abort(&self) {
        self.complete();
    }

    pub fn is_busy(&self) -> bool {
        !matches!(*self.phase.lock().unwrap(), GlobalPhase::Idle)
    }

    pub fn current_phase(&self) -> GlobalPhase {
        self.phase.lock().unwrap().clone()
    }
}

impl Default for GlobalController {
    fn default() -> Self {
        Self::new()
    }
}

// No tests here - we'd just be testing that Mutex works.
// Real tests require PR 2 with mock injection.
