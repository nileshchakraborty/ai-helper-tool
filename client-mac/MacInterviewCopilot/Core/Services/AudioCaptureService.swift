import AVFoundation
import Foundation
import Combine
import SwiftUI

/// Captures system audio and microphone input for interview transcription
@MainActor
public class AudioCaptureService: NSObject, ObservableObject {
    public static let shared = AudioCaptureService()
    
    @Published public var isRecording = false
    @Published public var audioLevel: Float = 0.0
    @Published public var transcription: String = ""
    @Published public var error: String?
    @Published public var isProcessing = false
    
    private var audioEngine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var audioBuffer: [Float] = []
    private var silenceTimer: Timer?
    private let silenceThreshold: Float = 0.01
    private let silenceDuration: TimeInterval = 2.0 // seconds of silence before processing
    private var lastSoundTime: Date = Date()
    
    private var cancellables = Set<AnyCancellable>()
    
    public override init() {
        super.init()
    }
    
    /// Start capturing audio from microphone
    public func startRecording() {
        guard !isRecording else { return }
        
        // Request microphone permission
        AVCaptureDevice.requestAccess(for: .audio) { [weak self] granted in
            DispatchQueue.main.async {
                if granted {
                    self?.setupAndStartAudioEngine()
                } else {
                    self?.error = "Microphone access denied. Grant permission in System Preferences > Privacy > Microphone"
                }
            }
        }
    }
    
    /// Stop audio capture
    public func stopRecording() {
        guard isRecording else { return }
        
        audioEngine?.stop()
        inputNode?.removeTap(onBus: 0)
        audioEngine = nil
        inputNode = nil
        isRecording = false
        silenceTimer?.invalidate()
        silenceTimer = nil
    }
    
    /// Toggle recording state
    public func toggleRecording() {
        if isRecording {
            stopRecording()
        } else {
            startRecording()
        }
    }
    
    /// Clear current transcription
    public func clearTranscription() {
        transcription = ""
    }
    
    private func setupAndStartAudioEngine() {
        do {
            audioEngine = AVAudioEngine()
            guard let engine = audioEngine else { return }
            
            inputNode = engine.inputNode
            let format = inputNode?.outputFormat(forBus: 0)
            
            guard let inputFormat = format else {
                error = "Could not get audio input format"
                return
            }
            
            // Install tap on input node to capture audio
            inputNode?.installTap(onBus: 0, bufferSize: 4096, format: inputFormat) { [weak self] buffer, time in
                self?.processAudioSamples(buffer: buffer)
            }
            
            try engine.start()
            isRecording = true
            error = nil
            lastSoundTime = Date()
            
            // Start silence detection
            startSilenceDetection()
            
        } catch {
            self.error = "Failed to start audio capture: \(error.localizedDescription)"
        }
    }
    
    private func processAudioSamples(buffer: AVAudioPCMBuffer) {
        guard let channelData = buffer.floatChannelData?[0] else { return }
        let frameLength = Int(buffer.frameLength)
        
        // Calculate RMS for level meter
        var sum: Float = 0
        for i in 0..<frameLength {
            let sample = channelData[i]
            sum += sample * sample
        }
        let rms = sqrt(sum / Float(frameLength))
        
        DispatchQueue.main.async {
            self.audioLevel = min(rms * 5, 1.0) // Amplify for visibility
            
            // Track when we last heard sound
            if rms > self.silenceThreshold {
                self.lastSoundTime = Date()
            }
        }
        
        // Add samples to buffer for potential transcription
        for i in 0..<frameLength {
            audioBuffer.append(channelData[i])
        }
        
        // Keep buffer manageable (last 60 seconds at 44.1kHz)
        let maxSamples = 44100 * 60
        if audioBuffer.count > maxSamples {
            audioBuffer.removeFirst(audioBuffer.count - maxSamples)
        }
    }
    
    private func startSilenceDetection() {
        silenceTimer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            // Use Task to properly access MainActor-isolated properties
            Task { @MainActor in
                let silenceElapsed = Date().timeIntervalSince(self.lastSoundTime)
                
                // If we've had silence for the threshold duration, process the buffer
                if silenceElapsed > self.silenceDuration && !self.audioBuffer.isEmpty && !self.isProcessing {
                    self.processAudioBuffer()
                }
            }
        }
    }
    
    private func processAudioBuffer() {
        guard !audioBuffer.isEmpty else { return }
        
        isProcessing = true
        let samples = audioBuffer
        audioBuffer.removeAll()
        
        // Use macOS Speech Recognition or Whisper
        Task {
            await transcribeAudio(samples: samples)
        }
    }
    
    private func transcribeAudio(samples: [Float]) async {
        let settings = TranscriptionSettings.shared
        
        switch settings.provider {
        case .whisperLocal:
            do {
                let text = try await TranscriptionService.shared.transcribeWithWhisperLocal(audioFrames: samples)
                DispatchQueue.main.async {
                    if !text.isEmpty {
                        self.transcription = text
                    }
                    self.isProcessing = false
                }
            } catch {
                DispatchQueue.main.async {
                    self.error = error.localizedDescription
                    self.isProcessing = false
                }
            }
            
        case .appleSpeech:
            // Apple Speech is continuous and handled by TranscriptionService directly via startTranscription()
            // We don't need to push samples here unless we change architecture
            // Currently startAppleSpeechRecognition() installs its own tap
            DispatchQueue.main.async { self.isProcessing = false }
            
        default:
            DispatchQueue.main.async { self.isProcessing = false }
        }
    }
    
    /// Manually set transcription (for testing or manual input)
    public func setTranscription(_ text: String) {
        transcription = text
    }
}

// MARK: - Audio Recording Button
public struct AudioRecordButton: View {
    @StateObject private var audioService = AudioCaptureService.shared
    @StateObject private var transcriptionService = TranscriptionService.shared
    @StateObject private var settings = TranscriptionSettings.shared
    
    public init() {}
    
    public var body: some View {
        Button(action: {
            toggleListening()
        }) {
            HStack(spacing: 6) {
                Circle()
                    .fill(isListening ? Color.red : Color.gray)
                    .frame(width: 10, height: 10)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 1)
                    )
                
                if isListening {
                    if transcriptionService.isTranscribing {
                        AudioLevelIndicator()
                    } else {
                        ProgressView()
                            .scaleEffect(0.5)
                    }
                } else {
                    Text("🎤 Listen")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isListening ? Color.red.opacity(0.2) : Color.black.opacity(0.3))
            )
        }
        .buttonStyle(.plain)
        .help(isListening ? "Stop listening" : "Start listening to interviewer")
    }
    
    private var isListening: Bool {
        audioService.isRecording || transcriptionService.isTranscribing
    }
    
    private func toggleListening() {
        if isListening {
            // Stop all listening
            audioService.stopRecording()
            transcriptionService.stopTranscription()
        } else {
            // Start listening based on provider
            switch settings.provider {
            case .appleSpeech:
                // Request permissions and start Apple Speech
                transcriptionService.checkPermissionsIfNeeded()
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    transcriptionService.startTranscription()
                }
            case .whisperAPI, .whisperLocal:
                // Start audio capture for recording
                audioService.startRecording()
            case .manual:
                // Manual mode - just show the text field
                // The transcription area will show a text field
                break
            }
        }
    }
}

// MARK: - Audio Level Indicator
public struct AudioLevelIndicator: View {
    @ObservedObject var audioService = AudioCaptureService.shared
    
    public init() {}
    
    public var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<8, id: \.self) { index in
                Rectangle()
                    .fill(barColor(for: index))
                    .frame(width: 3, height: 10)
                    .opacity(audioService.audioLevel > Float(index) * 0.125 ? 1.0 : 0.3)
            }
        }
    }
    
    private func barColor(for index: Int) -> Color {
        if index < 5 {
            return .green
        } else if index < 7 {
            return .yellow
        } else {
            return .red
        }
    }
}

// MARK: - Transcription Display
public struct TranscriptionView: View {
    @ObservedObject var audioService = AudioCaptureService.shared
    let onSendForAssist: (String) -> Void
    
    public init(onSendForAssist: @escaping (String) -> Void) {
        self.onSendForAssist = onSendForAssist
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Interviewer Said:")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                if !audioService.transcription.isEmpty {
                    Button("Clear") {
                        audioService.clearTranscription()
                    }
                    .font(.caption2)
                    .buttonStyle(.plain)
                    .foregroundColor(.secondary)
                }
            }
            
            if audioService.transcription.isEmpty {
                Text("Start listening or type what the interviewer said...")
                    .font(.caption)
                    .foregroundColor(.secondary.opacity(0.5))
                    .italic()
            } else {
                Text(audioService.transcription)
                    .font(.body)
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.black.opacity(0.3))
                    .cornerRadius(6)
            }
            
            if !audioService.transcription.isEmpty && !audioService.transcription.hasPrefix("[") {
                Button(action: {
                    onSendForAssist(audioService.transcription)
                }) {
                    HStack {
                        Image(systemName: "sparkles")
                        Text("Get AI Assist")
                    }
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.cyan.opacity(0.3))
                    .cornerRadius(6)
                }
                .buttonStyle(.plain)
            }
            
            if let error = audioService.error {
                Text(error)
                    .font(.caption2)
                    .foregroundColor(.red)
            }
        }
    }
}
