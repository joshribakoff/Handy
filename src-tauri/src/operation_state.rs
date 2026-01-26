//! Pure state machine for operation lifecycle management.
//!
//! # Overview
//!
//! A voice transcription operation has multiple phases that form ONE atomic
//! operation from the user's perspective:
//!
//! ```text
//! ┌──────┐   start    ┌───────────┐   stop    ┌────────────┐  complete  ┌──────┐
//! │ Idle │ ────────▶  │ Recording │ ───────▶  │ Processing │ ─────────▶ │ Idle │
//! └──────┘            └───────────┘           └────────────┘            └──────┘
//!    │                                              │
//!    │◀─────────────── BLOCKED ─────────────────────│
//! ```
//!
//! The key insight: you cannot start a new operation until the ENTIRE flow
//! completes (including transcription). This prevents race conditions when
//! users rapidly press the hotkey.
//!
//! # Design
//!
//! - **Pure state machine**: No side effects, no async, no mutexes inside
//! - **State machine is source of truth**: Caller attempts a transition via
//!   `maybe_*` methods. If the transition succeeds (returns `true`), the state
//!   is already updated atomically. Caller then executes side effects (show UI,
//!   capture audio, etc.). This ensures UI reflects actual state machine state.
//! - **Synchronous**: State transitions are immediate; blocking is just
//!   returning `TransitionResult::Blocked` (or `false` from controller methods)
//!
//! # Usage
//!
//! ```ignore
//! let state = OperationState::default();
//!
//! // Caller attempts transition, handles side effects if allowed
//! let (new_state, result) = state.maybe_start_recording();
//! if matches!(result, TransitionResult::Ok) {
//!     show_overlay("recording");
//!     start_audio_capture();
//!     state = new_state;
//! }
//! // If Blocked, caller does nothing - operation already in progress
//! ```
//!
//! # Related Issues
//!
//! - #641: App crashes when push-to-talk hit twice in a row
//! - #462: Race -> crash on rapid toggle
//!
//! # Future Enhancements
//!
//! TODO: Instead of blocking when user presses hotkey during Processing,
//! we could set a "pending" flag. When processing completes, check the flag
//! and auto-start the next recording instead of going to Idle. This would
//! feel more responsive for rapid dictation workflows.
//!
//! TODO: Consider Mac-like real-time segmentation where we detect pauses
//! during recording and create nested transcribe operations for each segment.
//! This would make transcription feel real-time and greatly reduce the
//! processing time at the end, minimizing the overlap period during which
//! race conditions could occur. However, this adds complexity, so we focus
//! on simplicity first (blocking concurrent operations) before adding this.

use serde::Serialize;

/// The possible states of an operation lifecycle.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub enum OperationState {
    /// Ready to start a new operation
    Idle,
    /// Currently recording audio
    Recording,
    /// Processing/transcribing the recording
    Processing,
}

/// Result of attempting a state transition
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TransitionResult {
    /// Transition succeeded
    Ok,
    /// Transition blocked - operation already in progress
    Blocked { current_state: OperationState },
}

impl OperationState {
    /// Attempt to start recording. Only succeeds from Idle state.
    pub fn maybe_start_recording(&self) -> (OperationState, TransitionResult) {
        match self {
            OperationState::Idle => (OperationState::Recording, TransitionResult::Ok),
            other => (
                other.clone(),
                TransitionResult::Blocked {
                    current_state: other.clone(),
                },
            ),
        }
    }

    /// Attempt to stop recording and begin processing.
    /// Only succeeds from Recording state.
    pub fn maybe_stop_recording(&self) -> (OperationState, TransitionResult) {
        match self {
            OperationState::Recording => (OperationState::Processing, TransitionResult::Ok),
            other => (
                other.clone(),
                TransitionResult::Blocked {
                    current_state: other.clone(),
                },
            ),
        }
    }

    /// Mark processing as complete, return to Idle.
    /// Only succeeds from Processing state.
    pub fn complete_processing(&self) -> (OperationState, TransitionResult) {
        match self {
            OperationState::Processing => (OperationState::Idle, TransitionResult::Ok),
            other => (
                other.clone(),
                TransitionResult::Blocked {
                    current_state: other.clone(),
                },
            ),
        }
    }
}

impl Default for OperationState {
    fn default() -> Self {
        OperationState::Idle
    }
}

// --- Thread-safe wrapper for use as Tauri managed state ---

use std::sync::Mutex;

/// Thread-safe operation controller for use with Tauri's managed state.
///
/// Wraps the pure state machine with a Mutex for safe concurrent access.
/// The caller is responsible for side effects - this just manages state.
pub struct OperationController {
    state: Mutex<OperationState>,
}

impl OperationController {
    pub fn new() -> Self {
        Self {
            state: Mutex::new(OperationState::default()),
        }
    }

    /// Attempt to start recording. Returns true if allowed, false if blocked.
    pub fn maybe_start_recording(&self) -> bool {
        let mut state = self.state.lock().unwrap();
        let (new_state, result) = state.maybe_start_recording();
        if matches!(result, TransitionResult::Ok) {
            *state = new_state;
            true
        } else {
            false
        }
    }

    /// Attempt to stop recording and begin processing. Returns true if allowed.
    pub fn maybe_stop_recording(&self) -> bool {
        let mut state = self.state.lock().unwrap();
        let (new_state, result) = state.maybe_stop_recording();
        if matches!(result, TransitionResult::Ok) {
            *state = new_state;
            true
        } else {
            false
        }
    }

    /// Mark processing as complete. Returns true if allowed.
    pub fn complete_processing(&self) -> bool {
        let mut state = self.state.lock().unwrap();
        let (new_state, result) = state.complete_processing();
        if matches!(result, TransitionResult::Ok) {
            *state = new_state;
            true
        } else {
            false
        }
    }

    /// Force reset to Idle state. Used for cancellation.
    /// This bypasses normal state transitions - use only for cancel/error recovery.
    pub fn reset_to_idle(&self) {
        let mut state = self.state.lock().unwrap();
        *state = OperationState::Idle;
    }

    /// Get the current state (for debugging/UI).
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
        let state = OperationState::default();
        assert_eq!(state, OperationState::Idle);
    }

    #[test]
    fn can_start_recording_from_idle() {
        let state = OperationState::Idle;
        let (new_state, result) = state.maybe_start_recording();

        assert_eq!(new_state, OperationState::Recording);
        assert_eq!(result, TransitionResult::Ok);
    }

    #[test]
    fn cannot_start_recording_while_recording() {
        let state = OperationState::Recording;
        let (new_state, result) = state.maybe_start_recording();

        assert_eq!(new_state, OperationState::Recording);
        assert_eq!(
            result,
            TransitionResult::Blocked {
                current_state: OperationState::Recording
            }
        );
    }

    #[test]
    fn cannot_start_recording_while_processing() {
        let state = OperationState::Processing;
        let (new_state, result) = state.maybe_start_recording();

        assert_eq!(new_state, OperationState::Processing);
        assert_eq!(
            result,
            TransitionResult::Blocked {
                current_state: OperationState::Processing
            }
        );
    }

    #[test]
    fn can_stop_recording_to_processing() {
        let state = OperationState::Recording;
        let (new_state, result) = state.maybe_stop_recording();

        assert_eq!(new_state, OperationState::Processing);
        assert_eq!(result, TransitionResult::Ok);
    }

    #[test]
    fn cannot_stop_from_idle() {
        let state = OperationState::Idle;
        let (new_state, result) = state.maybe_stop_recording();

        assert_eq!(new_state, OperationState::Idle);
        assert_eq!(
            result,
            TransitionResult::Blocked {
                current_state: OperationState::Idle
            }
        );
    }

    #[test]
    fn can_complete_processing() {
        let state = OperationState::Processing;
        let (new_state, result) = state.complete_processing();

        assert_eq!(new_state, OperationState::Idle);
        assert_eq!(result, TransitionResult::Ok);
    }

    #[test]
    fn cannot_complete_from_recording() {
        let state = OperationState::Recording;
        let (new_state, result) = state.complete_processing();

        assert_eq!(new_state, OperationState::Recording);
        assert_eq!(
            result,
            TransitionResult::Blocked {
                current_state: OperationState::Recording
            }
        );
    }

    #[test]
    fn full_lifecycle() {
        let mut state = OperationState::default();

        // Start recording
        let (new_state, result) = state.maybe_start_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Try to start another recording (should fail)
        let (_, result) = state.maybe_start_recording();
        assert!(matches!(result, TransitionResult::Blocked { .. }));

        // Stop recording -> processing
        let (new_state, result) = state.maybe_stop_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Try to start recording while processing (should fail)
        let (_, result) = state.maybe_start_recording();
        assert!(matches!(result, TransitionResult::Blocked { .. }));

        // Complete processing
        let (new_state, result) = state.complete_processing();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Now we can start again
        assert_eq!(state, OperationState::Idle);
    }

    #[test]
    fn rapid_start_attempts_blocked() {
        // Simulates user rapidly pressing hotkey
        let mut state = OperationState::Idle;

        // First attempt succeeds
        let (new_state, result) = state.maybe_start_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Rapid subsequent attempts all blocked
        for _ in 0..10 {
            let (new_state, result) = state.maybe_start_recording();
            assert!(matches!(result, TransitionResult::Blocked { .. }));
            assert_eq!(new_state, OperationState::Recording);
        }
    }

    // --- OperationController tests ---

    #[test]
    fn controller_starts_idle() {
        let controller = super::OperationController::new();
        assert_eq!(controller.current_state(), OperationState::Idle);
    }

    #[test]
    fn controller_full_lifecycle() {
        let controller = super::OperationController::new();

        // Start recording
        assert!(controller.maybe_start_recording());
        assert_eq!(controller.current_state(), OperationState::Recording);

        // Can't start again
        assert!(!controller.maybe_start_recording());

        // Stop recording -> processing
        assert!(controller.maybe_stop_recording());
        assert_eq!(controller.current_state(), OperationState::Processing);

        // Can't start while processing
        assert!(!controller.maybe_start_recording());

        // Complete
        assert!(controller.complete_processing());
        assert_eq!(controller.current_state(), OperationState::Idle);

        // Now can start again
        assert!(controller.maybe_start_recording());
    }

    #[test]
    fn controller_thread_safe() {
        use std::sync::Arc;
        use std::thread;

        let controller = Arc::new(super::OperationController::new());

        // First thread starts recording
        let c1 = Arc::clone(&controller);
        let h1 = thread::spawn(move || c1.maybe_start_recording());

        // Wait for first to complete
        let first_succeeded = h1.join().unwrap();
        assert!(first_succeeded);

        // Subsequent attempts from multiple threads should all fail
        let handles: Vec<_> = (0..10)
            .map(|_| {
                let c = Arc::clone(&controller);
                thread::spawn(move || c.maybe_start_recording())
            })
            .collect();

        for h in handles {
            assert!(!h.join().unwrap());
        }
    }
}
