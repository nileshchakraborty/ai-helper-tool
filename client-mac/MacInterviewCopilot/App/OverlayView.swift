import SwiftUI

struct OverlayView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        ZStack {
            // Glassy Background
            VisualEffectView(material: .hudWindow, blendingMode: .behindWindow)
                .edgesIgnoringSafeArea(.all)
            
            // Subtle top highlight for depth
            VStack {
                Rectangle()
                    .fill(Color.white.opacity(0.1))
                    .frame(height: 1)
                Spacer()
            }
            .edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 0) {
                // PREMIUM HEADER
                // Draggable area
                HStack {
                    // Left Status
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 8, height: 8)
                            .shadow(color: .green.opacity(0.6), radius: 4, x: 0, y: 0)
                        
                        Text("Stealth Active")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Drag Handle Visual Cue (Optional, window is draggable by background)
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.white.opacity(0.1))
                        .frame(width: 40, height: 4)
                    
                    Spacer()
                    
                    // Right Hint
                    Text("⌘⇧space to hide")
                        .font(.system(size: 10))
                        .foregroundColor(.gray.opacity(0.7))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.black.opacity(0.2))
                
                Divider()
                    .background(Color.white.opacity(0.1))
                
                // Main Content
                if appState.isLoggedIn {
                    AuthContentView()
                } else {
                    OnboardingView()
                }
            }
            
            // Subtle Border
            RoundedRectangle(cornerRadius: 0)
                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                .edgesIgnoringSafeArea(.all)
        }
        .preferredColorScheme(.dark)
    }
}

// MARK: - Main Content View
struct AuthContentView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var audioService = AudioCaptureService.shared
    @StateObject private var transcriptionService = TranscriptionService.shared
    @State private var showSettings = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Functional Header (Services)
            HStack(spacing: 12) {
                // Logo Area
                HStack(spacing: 8) {
                    Image(systemName: "brain.head.profile")
                        .font(.system(size: 16))
                        .foregroundColor(.cyan)
                    Text("Interview Copilot")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                }
                
                Spacer()
                
                // Controls Group
                HStack(spacing: 4) {
                    // Provider Badge
                    Button(action: { showSettings = true }) {
                        HStack(spacing: 4) {
                            Text(TranscriptionSettings.shared.provider.displayTitle)
                                .font(.system(size: 10, weight: .medium))
                            Image(systemName: "chevron.down")
                                .font(.system(size: 8))
                        }
                        .foregroundColor(.gray)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    
                    // Settings
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                            .frame(width: 28, height: 28)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                    
                    // Logout
                    Button(action: { appState.logout() }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                            .frame(width: 28, height: 28)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            
            // Main Action Area (Listen Button)
            VStack {
                HStack {
                    AudioRecordButton()
                    Spacer()
                }
            }
            .padding(.horizontal, 16)
            
            // Dynamic Content Area
            ScrollViewReader { proxy in
                VStack(spacing: 0) {
                    // Transcription Stream
                    if audioService.isRecording || transcriptionService.isTranscribing || 
                       !audioService.transcription.isEmpty || !transcriptionService.transcription.isEmpty {
                        
                        EnhancedTranscriptionView { transcription in
                            Task { await sendForAssist(transcription: transcription) }
                        }
                        .padding(16)
                        .background(Color.black.opacity(0.3))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.white.opacity(0.1), lineWidth: 1)
                        )
                        .padding(16)
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }
                    
                    // Chat Interface
                    ChatView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
        }
        .sheet(isPresented: $showSettings) {
            TranscriptionSettingsView()
        }
    }
    
    private func sendForAssist(transcription: String) async {
        print("Sending for AI assist: \(transcription)")
    }
}

// MARK: - Enhanced Transcription View
struct EnhancedTranscriptionView: View {
    @StateObject private var audioService = AudioCaptureService.shared
    @StateObject private var transcriptionService = TranscriptionService.shared
    @StateObject private var settings = TranscriptionSettings.shared
    @State private var manualInput = ""
    
    let onSendForAssist: (String) -> Void
    
    var currentTranscription: String {
        if settings.provider == .manual {
            return manualInput
        } else if !transcriptionService.transcription.isEmpty {
            return transcriptionService.transcription
        } else {
            return audioService.transcription
        }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Label("Live Transcription", systemImage: "waveform")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.cyan)
                
                if transcriptionService.isTranscribing {
                    Text("• Listening")
                        .font(.system(size: 10))
                        .foregroundColor(.red)
                }
                
                Spacer()
                
                if !currentTranscription.isEmpty {
                    Button("Clear") {
                        manualInput = ""
                        audioService.clearTranscription()
                        transcriptionService.clear()
                    }
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
                    .buttonStyle(.plain)
                }
            }
            
            // Input Area
            Group {
                if settings.provider == .manual {
                    TextField("Type what interviewer is saying...", text: $manualInput)
                        .textFieldStyle(.plain)
                        .padding(10)
                        .background(Color.white.opacity(0.05))
                        .cornerRadius(8)
                        .font(.system(size: 14))
                } else {
                    if currentTranscription.isEmpty {
                        Text("Listening for speech...")
                            .foregroundColor(.gray)
                            .italic()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                    } else {
                        Text(currentTranscription)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .font(.system(size: 14))
                            .foregroundColor(.white)
                            .padding(10)
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(8)
                    }
                }
            }
            
            // Quick Analysis (On-Device Local AI)
            if !currentTranscription.isEmpty && !currentTranscription.hasPrefix("[") {
                QuickAnalysisView(text: currentTranscription)
                    .transition(.opacity)
                
                // Main CTA
                Button(action: { onSendForAssist(currentTranscription) }) {
                    HStack {
                        Image(systemName: "sparkles")
                        Text("Generate AI Response")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(Color.cyan)
                    .foregroundColor(.black)
                    .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .shadow(color: .cyan.opacity(0.3), radius: 5, x: 0, y: 2)
            }
            
            // Error Display
            if let error = transcriptionService.error ?? audioService.error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }
}

// MARK: - Helper Extensions
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

extension TranscriptionProvider {
    var displayTitle: String {
        switch self {
        case .appleSpeech: return "Apple Speech"
        case .whisperAPI: return "Whisper Cloud"
        case .whisperLocal: return "Whisper Local"
        case .manual: return "Manual"
        }
    }
}

// Helper view to blur background if needed (kept for reference)
struct VisualEffectView: NSViewRepresentable {
    var material: NSVisualEffectView.Material
    var blendingMode: NSVisualEffectView.BlendingMode
    
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = material
        view.blendingMode = blendingMode
        view.state = .active
        return view
    }
    
    func updateNSView(_ nsView: NSVisualEffectView, context: Context) {
        nsView.material = material
        nsView.blendingMode = blendingMode
    }
}
