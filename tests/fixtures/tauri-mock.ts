/**
 * Mock Tauri invoke responses for testing.
 * These mocks allow the app to render without a real Tauri backend.
 */

export interface TauriMockConfig {
  /** If true, app shows main settings UI (skip onboarding) */
  hasModels?: boolean;
  /** Debug mode enabled */
  debugMode?: boolean;
  /** Post-processing enabled */
  postProcessEnabled?: boolean;
}

const DEFAULT_CONFIG: TauriMockConfig = {
  hasModels: true,
  debugMode: false,
  postProcessEnabled: false,
};

/**
 * Default mock responses for Tauri commands.
 */
// Models available for download (used in onboarding)
const AVAILABLE_MODELS = [
  {
    id: "parakeet-v3",
    name: "Parakeet V3",
    description: "Best balance of speed and accuracy",
    size: 500 * 1024 * 1024, // 500 MB
    accuracy: 95,
    speed: 85,
    featured: true,
    is_downloaded: false,
  },
  {
    id: "whisper-tiny",
    name: "Whisper Tiny",
    description: "Fastest, lowest accuracy",
    size: 75 * 1024 * 1024, // 75 MB
    accuracy: 60,
    speed: 100,
    featured: false,
    is_downloaded: false,
  },
  {
    id: "whisper-large",
    name: "Whisper Large",
    description: "Most accurate, slowest",
    size: 3 * 1024 * 1024 * 1024, // 3 GB
    accuracy: 100,
    speed: 30,
    featured: false,
    is_downloaded: false,
  },
];

export function getMockResponses(config: TauriMockConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Provide available models for onboarding (when hasModels is false)
  const models = cfg.hasModels ? [] : AVAILABLE_MODELS;

  return {
    // Model commands
    has_any_models_available: cfg.hasModels,
    has_any_models_or_downloads: cfg.hasModels,
    get_available_models: models,
    get_current_model: null,
    get_transcription_model_status: null,
    is_model_loading: false,
    get_model_load_status: { is_loaded: false, current_model: null },
    get_recommended_first_model: "whisper-small",

    // Settings commands
    get_app_settings: {
      debug_mode: cfg.debugMode,
      post_process_enabled: cfg.postProcessEnabled,
      push_to_talk: false,
      audio_feedback: true,
      audio_feedback_volume: 0.5,
      start_hidden: false,
      autostart: false,
      translate_to_english: false,
      selected_language: "auto",
      overlay_position: "bottom",
      paste_method: "ctrl_v",
      clipboard_handling: "dont_modify",
      word_correction_threshold: 0.8,
      sound_theme: "marimba",
      mute_while_recording: false,
      append_trailing_space: true,
      app_language: "en",
      update_checks: true,
      model_unload_timeout: "never",
      history_limit: 100,
      recording_retention_period: "never",
      always_on_microphone: false,
      clamshell_microphone: null,
      keyboard_implementation: "tauri",
      experimental_enabled: false,
      custom_words: [],
      post_process_provider_id: null,
      post_process_providers: {},
      post_process_selected_prompt_id: null,
      post_process_prompts: [],
    },
    get_default_settings: {},
    get_app_dir_path: "/mock/app/dir",
    get_log_dir_path: "/mock/log/dir",

    // Audio commands
    get_available_microphones: [],
    get_selected_microphone: null,
    get_available_output_devices: [],
    get_selected_output_device: null,
    get_microphone_mode: false,
    is_recording: false,
    get_clamshell_microphone: null,
    is_laptop: false,

    // History commands
    get_history_entries: [],

    // Shortcut commands
    get_keyboard_implementation: "tauri",

    // Misc commands
    initialize_enigo: null,
    check_apple_intelligence_available: false,
    check_custom_sounds: [],

    // Permission commands (for onboarding)
    check_accessibility_permission: true,
    check_microphone_permission: true,

    // Plugin commands
    "plugin:macos-permissions|check_accessibility_permission": true,
    "plugin:macos-permissions|check_microphone_permission": true,
    "plugin:app|version": "0.1.0-test",
    "plugin:event|listen": 1, // Return listener ID
  };
}

/**
 * Script to inject into page that mocks Tauri invoke.
 */
export function getTauriMockScript(config: TauriMockConfig = {}): string {
  const responses = getMockResponses(config);
  const responsesJson = JSON.stringify(responses);

  return `
    (function() {
      const mockResponses = ${responsesJson};

      // Mock the Tauri invoke function
      window.__TAURI_INTERNALS__ = window.__TAURI_INTERNALS__ || {};
      window.__TAURI_INTERNALS__.invoke = function(cmd, args) {
        console.log('[TauriMock] invoke:', cmd, args);

        // Convert command name from snake_case
        const response = mockResponses[cmd];

        if (response !== undefined) {
          return Promise.resolve(response);
        }

        // Default: return null for unknown commands
        console.warn('[TauriMock] Unknown command:', cmd);
        return Promise.resolve(null);
      };

      // Mock event listening (no-op)
      window.__TAURI_INTERNALS__.transformCallback = function(cb) {
        return 0;
      };

      // Mock OS plugin internals
      window.__TAURI_OS_PLUGIN_INTERNALS__ = {
        os_type: "macos",
        platform: "macos",
        family: "unix",
        version: "14.0.0",
        arch: "aarch64",
        exe_extension: "",
        eol: "\\n"
      };

      console.log('[TauriMock] Mocks installed');
    })();
  `;
}
