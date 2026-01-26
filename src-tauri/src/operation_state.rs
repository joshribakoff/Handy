//! Pure state machine for operation lifecycle management.
//!
//! This module provides a simple, testable state machine that prevents
//! concurrent operations. The design is intentionally simple:
//! - Only one operation can run at a time
//! - Operations cannot be cancelled mid-transcription
//! - State transitions are explicit and tested

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
    pub fn try_start_recording(&self) -> (OperationState, TransitionResult) {
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
    pub fn try_stop_recording(&self) -> (OperationState, TransitionResult) {
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

    /// Check if a new operation can be started.
    pub fn can_start(&self) -> bool {
        matches!(self, OperationState::Idle)
    }

    /// Check if currently busy (recording or processing).
    pub fn is_busy(&self) -> bool {
        !matches!(self, OperationState::Idle)
    }
}

impl Default for OperationState {
    fn default() -> Self {
        OperationState::Idle
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn starts_idle() {
        let state = OperationState::default();
        assert_eq!(state, OperationState::Idle);
        assert!(state.can_start());
        assert!(!state.is_busy());
    }

    #[test]
    fn can_start_recording_from_idle() {
        let state = OperationState::Idle;
        let (new_state, result) = state.try_start_recording();

        assert_eq!(new_state, OperationState::Recording);
        assert_eq!(result, TransitionResult::Ok);
        assert!(!new_state.can_start());
        assert!(new_state.is_busy());
    }

    #[test]
    fn cannot_start_recording_while_recording() {
        let state = OperationState::Recording;
        let (new_state, result) = state.try_start_recording();

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
        let (new_state, result) = state.try_start_recording();

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
        let (new_state, result) = state.try_stop_recording();

        assert_eq!(new_state, OperationState::Processing);
        assert_eq!(result, TransitionResult::Ok);
    }

    #[test]
    fn cannot_stop_from_idle() {
        let state = OperationState::Idle;
        let (new_state, result) = state.try_stop_recording();

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
        assert!(new_state.can_start());
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
        let (new_state, result) = state.try_start_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Try to start another recording (should fail)
        let (_, result) = state.try_start_recording();
        assert!(matches!(result, TransitionResult::Blocked { .. }));

        // Stop recording -> processing
        let (new_state, result) = state.try_stop_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Try to start recording while processing (should fail)
        let (_, result) = state.try_start_recording();
        assert!(matches!(result, TransitionResult::Blocked { .. }));

        // Complete processing
        let (new_state, result) = state.complete_processing();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Now we can start again
        assert!(state.can_start());
    }

    #[test]
    fn rapid_start_attempts_blocked() {
        // Simulates user rapidly pressing hotkey
        let mut state = OperationState::Idle;

        // First attempt succeeds
        let (new_state, result) = state.try_start_recording();
        assert_eq!(result, TransitionResult::Ok);
        state = new_state;

        // Rapid subsequent attempts all blocked
        for _ in 0..10 {
            let (new_state, result) = state.try_start_recording();
            assert!(matches!(result, TransitionResult::Blocked { .. }));
            assert_eq!(new_state, OperationState::Recording);
        }
    }
}
