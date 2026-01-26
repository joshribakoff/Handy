use crate::managers::audio::AudioRecordingManager;
use crate::managers::transcription::TranscriptionManager;
use crate::operation_state::{OperationController, OperationState};
use crate::shortcut;
use crate::ManagedToggleState;
use log::{debug, info, warn};
use std::sync::Arc;
use tauri::{AppHandle, Manager};

// Re-export all utility modules for easy access
// pub use crate::audio_feedback::*;
pub use crate::clipboard::*;
pub use crate::overlay::*;
pub use crate::tray::*;

/// Centralized cancellation function that can be called from anywhere in the app.
/// Handles cancelling both recording and transcription operations and updates UI state.
pub fn cancel_current_operation(app: &AppHandle) {
    let op_controller = app.state::<Arc<OperationController>>();
    let current_state = op_controller.current_state();

    info!(
        "Initiating operation cancellation (current state: {:?})...",
        current_state
    );

    match current_state {
        OperationState::Idle => {
            debug!("Cancel called but already idle - nothing to do");
            return;
        }
        OperationState::Recording => {
            // Cancel recording: discard audio samples
            let audio_manager = app.state::<Arc<AudioRecordingManager>>();
            audio_manager.cancel_recording();

            // Unload model if immediate unload is enabled
            let tm = app.state::<Arc<TranscriptionManager>>();
            tm.maybe_unload_immediately("cancellation");
        }
        OperationState::Processing => {
            // Can't stop transcription mid-inference, but we can reset state
            // The async task will complete but we've signaled we don't care
            debug!("Cancelling during processing - async task may still complete");
        }
    }

    // Unregister the cancel shortcut
    shortcut::unregister_cancel_shortcut(app);

    // Reset all shortcut toggle states
    let toggle_state_manager = app.state::<ManagedToggleState>();
    if let Ok(mut states) = toggle_state_manager.lock() {
        states.active_toggles.values_mut().for_each(|v| *v = false);
    } else {
        warn!("Failed to lock toggle state manager during cancellation");
    }

    // Update UI
    change_tray_icon(app, crate::tray::TrayIconState::Idle);
    hide_recording_overlay(app);

    // Reset state machine to Idle
    op_controller.reset_to_idle();

    info!("Operation cancellation completed - returned to idle state");
}

/// Check if using the Wayland display server protocol
#[cfg(target_os = "linux")]
pub fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok()
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v.to_lowercase() == "wayland")
            .unwrap_or(false)
}
