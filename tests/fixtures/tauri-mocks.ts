import { Page } from "@playwright/test";

export interface MockHistoryEntry {
  id: number;
  file_name: string;
  timestamp: number;
  saved: boolean;
  title: string;
  transcription_text: string;
  post_processed_text: string | null;
  post_process_prompt: string | null;
}

export interface TauriMockConfig {
  hasModels?: boolean;
  historyEntries?: MockHistoryEntry[];
}

/**
 * Injects Tauri command mocks into the page to enable testing without Tauri backend
 */
export async function setupTauriMocks(
  page: Page,
  config: TauriMockConfig = {}
): Promise<void> {
  const { hasModels = true, historyEntries = [] } = config;

  await page.addInitScript(
    ({ hasModels, historyEntries }) => {
      // Mock Tauri invoke
      (window as any).__TAURI_INTERNALS__ = {
        invoke: async (cmd: string, args?: any) => {
          console.log(`[Tauri Mock] invoke: ${cmd}`, args);

          switch (cmd) {
            case "has_any_models_available":
              return hasModels;
            case "get_history_entries":
              return historyEntries;
            case "get_settings":
              return {
                bindings: {},
                push_to_talk: false,
                audio_feedback: false,
                debug_mode: false,
              };
            case "initialize_enigo":
              return null;
            case "toggle_history_entry_saved":
              return null;
            case "delete_history_entry":
              return null;
            case "open_recordings_folder":
              return null;
            case "get_audio_file_path":
              return "/mock/audio/path.wav";
            case "get_available_microphones":
              return [{ index: "0", name: "Default Microphone", is_default: true }];
            case "get_available_output_devices":
              return [{ index: "0", name: "Default Speaker", is_default: true }];
            case "get_selected_microphone":
              return "Default Microphone";
            case "get_selected_output_device":
              return "Default Speaker";
            case "is_laptop":
              return false;
            case "get_model_load_status":
              return { is_loaded: false, current_model: null };
            default:
              console.warn(`[Tauri Mock] Unhandled command: ${cmd}`);
              return null;
          }
        },
        transformCallback: () => {},
        convertFileSrc: (path: string) => path,
      };

      // Mock Tauri event listener
      (window as any).__TAURI__ = {
        event: {
          listen: async () => () => {},
          once: async () => () => {},
          emit: async () => {},
        },
        core: {
          invoke: (window as any).__TAURI_INTERNALS__.invoke,
          convertFileSrc: (path: string) => path,
        },
      };
    },
    { hasModels, historyEntries }
  );
}

/**
 * Creates sample history entries for testing
 */
export function createMockHistoryEntries(count: number): MockHistoryEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    file_name: `recording_${i + 1}.wav`,
    timestamp: Date.now() - i * 3600000, // Each hour earlier
    saved: i === 0, // First entry is saved
    title: `Recording ${i + 1}`,
    transcription_text: `This is transcription text for entry ${i + 1}. It contains some sample content.`,
    post_processed_text: null,
    post_process_prompt: null,
  }));
}
