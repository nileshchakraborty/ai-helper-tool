import Foundation
import Speech
import Combine

/// Transcription provider options
public enum TranscriptionProvider: String, CaseIterable, Codable {
    case appleSpeech = "Apple Speech"
    case whisperAPI = "Whisper API"
    case whisperLocal = "Whisper Local"
    case manual = "Manual Input"
    
    var description: String {
        switch self {
        case .appleSpeech:
            return "macOS built-in speech recognition (free, requires permission)"
        case .whisperAPI:
            return "OpenAI Whisper API (accurate, requires API key)"
        case .whisperLocal:
            return "Whisper.cpp local model (private, no internet required)"
        case .manual:
            return "Type what the interviewer said manually"
        }
    }
}

/// Settings for transcription
public class TranscriptionSettings: ObservableObject {
    public static let shared = TranscriptionSettings()
    
    @Published public var provider: TranscriptionProvider {
        didSet {
            UserDefaults.standard.set(provider.rawValue, forKey: "transcriptionProvider")
        }
    }
    
    @Published public var whisperAPIKey: String {
        didSet {
            // In production, use Keychain instead
            UserDefaults.standard.set(whisperAPIKey, forKey: "whisperAPIKey")
        }
    }
    
    @Published public var whisperModel: String {
        didSet {
            UserDefaults.standard.set(whisperModel, forKey: "whisperModel")
        }
    }
    
    private init() {
        // Default to manual to avoid permission issues on first launch
        let savedProvider = UserDefaults.standard.string(forKey: "transcriptionProvider") ?? TranscriptionProvider.manual.rawValue
        self.provider = TranscriptionProvider(rawValue: savedProvider) ?? .manual
        self.whisperAPIKey = UserDefaults.standard.string(forKey: "whisperAPIKey") ?? ""
        self.whisperModel = UserDefaults.standard.string(forKey: "whisperModel") ?? "whisper-1"
    }
}

/// Unified transcription service supporting multiple providers
@MainActor
public class TranscriptionService: ObservableObject {
    public static let shared = TranscriptionService()
    
    @Published public var isTranscribing = false
    @Published public var transcription = ""
    @Published public var error: String?
    @Published public var isAvailable = false
    @Published public var permissionChecked = false
    
    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?
    
    private let settings = TranscriptionSettings.shared
    
    private init() {
        // Don't request permissions on init - wait until user explicitly enables
        // This prevents TCC crash on app launch
    }
    
    /// Check and request permissions - call this only when user wants to use speech
    public func checkPermissionsIfNeeded() {
        guard !permissionChecked else { return }
        permissionChecked = true
        
        // Only check if Apple Speech is selected
        guard settings.provider == .appleSpeech else {
            isAvailable = true
            return
        }
        
        SFSpeechRecognizer.requestAuthorization { [weak self] status in
            DispatchQueue.main.async {
                switch status {
                case .authorized:
                    self?.isAvailable = true
                    self?.speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
                case .denied, .restricted, .notDetermined:
                    self?.isAvailable = false
                    self?.error = "Speech recognition not authorized. Enable in System Preferences > Privacy > Speech Recognition"
                @unknown default:
                    break
                }
            }
        }
    }
    
    /// Start real-time transcription using selected provider
    public func startTranscription() {
        let provider = settings.provider
        
        switch provider {
        case .appleSpeech:
            startAppleSpeechRecognition()
        case .whisperAPI:
            // Whisper API works on completed audio, not real-time
            // We'll use it in processAudio method
            error = "Whisper API: Record audio first, then transcribe"
        case .whisperLocal:
            error = "Whisper Local: Download whisper.cpp model first"
        case .manual:
            // Manual mode - user types directly
            break
        }
    }
    
    /// Stop transcription
    public func stopTranscription() {
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine = nil
        
        isTranscribing = false
    }
    
    // MARK: - Apple Speech Recognition
    
    private func startAppleSpeechRecognition() {
        guard isAvailable else {
            error = "Speech recognition not available"
            return
        }
        
        guard let recognizer = speechRecognizer, recognizer.isAvailable else {
            error = "Speech recognizer not available"
            return
        }
        
        do {
            audioEngine = AVAudioEngine()
            guard let engine = audioEngine else { return }
            
            recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            guard let request = recognitionRequest else { return }
            
            request.shouldReportPartialResults = true
            request.requiresOnDeviceRecognition = false // Set to true for offline
            
            let inputNode = engine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            
            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
                self?.recognitionRequest?.append(buffer)
            }
            
            recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
                DispatchQueue.main.async {
                    if let result = result {
                        self?.transcription = result.bestTranscription.formattedString
                    }
                    
                    if let error = error {
                        self?.error = error.localizedDescription
                        self?.stopTranscription()
                    }
                }
            }
            
            engine.prepare()
            try engine.start()
            isTranscribing = true
            error = nil
            
        } catch {
            self.error = "Failed to start speech recognition: \(error.localizedDescription)"
        }
    }
    
    // MARK: - Whisper API
    
    /// Transcribe audio data using OpenAI Whisper API
    public func transcribeWithWhisperAPI(audioData: Data) async throws -> String {
        let apiKey = settings.whisperAPIKey
        guard !apiKey.isEmpty else {
            throw TranscriptionError.missingAPIKey
        }
        
        let url = URL(string: "https://api.openai.com/v1/audio/transcriptions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add audio file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/wav\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n".data(using: .utf8)!)
        
        // Add model
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"model\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(settings.whisperModel)\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw TranscriptionError.apiError("API request failed")
        }
        
        struct WhisperResponse: Codable {
            let text: String
        }
        
        let result = try JSONDecoder().decode(WhisperResponse.self, from: data)
        return result.text
    }
    
    // MARK: - Whisper Local (whisper.cpp)
    
    /// Transcribe audio using local Whisper model
    /// Note: Requires whisper.cpp to be built and model downloaded
    public func transcribeWithWhisperLocal(audioPath: String) async throws -> String {
        // This would call whisper.cpp via Process
        // For now, return placeholder
        throw TranscriptionError.notImplemented("Whisper.cpp integration requires model download")
    }
    
    /// Clear current transcription
    public func clear() {
        transcription = ""
        error = nil
    }
}

// MARK: - Errors

public enum TranscriptionError: Error, LocalizedError {
    case missingAPIKey
    case apiError(String)
    case notImplemented(String)
    case permissionDenied
    
    public var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "Whisper API key not configured. Add it in Settings."
        case .apiError(let message):
            return "API Error: \(message)"
        case .notImplemented(let message):
            return message
        case .permissionDenied:
            return "Speech recognition permission denied"
        }
    }
}

// MARK: - Settings View
// Moved to App/TranscriptionSettingsView.swift
