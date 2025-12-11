import SwiftUI
import OpenAPIClient

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    @State private var question = ""
    @State private var context = ""
    @State private var code = "" // Added code state
    @State private var messages: [ChatMessage] = []
    @State private var isStreaming = false
    @State private var currentResponse = ""
    @State private var mode: ChatMode = .behavioral
    
    enum ChatMode: String, CaseIterable, Identifiable {
        case behavioral = "Behavioral"
        case coding = "Coding"
        var id: String { self.rawValue }
    }
    
    @State private var screenSnapshotData: Data? // Store captured image data
    
    struct ChatMessage: Identifiable {
        let id = UUID()
        let role: String // "user" or "assistant"
        let content: String
    }
    
    var body: some View {
        VStack {
            ScrollViewReader { proxy in
                // Mode Picker
                Picker("Mode", selection: $mode) {
                    ForEach(ChatMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal)
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(messages) { msg in
                            HStack {
                                if msg.role == "user" {
                                    Spacer()
                                    Text(msg.content)
                                        .padding()
                                        .background(Color.blue)
                                        .foregroundColor(.white)
                                        .cornerRadius(8)
                                } else {
                                    Text(msg.content)
                                        .padding()
                                        .background(Color.gray.opacity(0.2))
                                        .cornerRadius(8)
                                    Spacer()
                                }
                            }
                        }
                        
                        if !currentResponse.isEmpty {
                            HStack {
                                Text(currentResponse)
                                    .padding()
                                    .background(Color.gray.opacity(0.2))
                                    .cornerRadius(8)
                                Spacer()
                            }
                        }
                    }
                    .padding()
                    .onChange(of: messages.count) { oldValue, newValue in
                        scrollToBottom(proxy)
                    }
                    .onChange(of: currentResponse) { oldValue, newValue in
                         scrollToBottom(proxy)
                    }
                }
            }
            
            Divider()
            
            VStack(spacing: 8) {
                if mode == .behavioral {
                    TextEditor(text: $context)
                        .frame(height: 60)
                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.gray.opacity(0.5)))
                        .overlay(Text("Context/Job Description").foregroundColor(.gray).opacity(context.isEmpty ? 0.5 : 0).padding(4), alignment: .topLeading)
                } else {
                    TextEditor(text: $code)
                        .frame(height: 80)
                        .font(.monospaced(.body)())
                        .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.gray.opacity(0.5)))
                        .overlay(Text("Paste Code Snippet").foregroundColor(.gray).opacity(code.isEmpty ? 0.5 : 0).padding(4), alignment: .topLeading)
                }
                
                HStack {
                    TextField("Enter your question...", text: $question)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: captureScreen) {
                        Image(systemName: "camera.viewfinder")
                    }
                    .help("Capture Screen & OCR")
                    
                    Button("Ask") {
                        sendMessage()
                    }
                    .disabled(question.isEmpty || isStreaming)
                }
            }
            .padding()
        }
    }
    
    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        if let last = messages.last {
            proxy.scrollTo(last.id, anchor: .bottom)
        }
    }
    
    func sendMessage() {
        let q = question
        let c = context
        question = "" // Clear input
        
        messages.append(ChatMessage(role: "user", content: q))
        isStreaming = true
        currentResponse = ""
        
        Task {
            do {
                // Ensure session exists or rely on backend to create (we modified routes to use sessionId optional)
                // If we want history, we should create session first. 
                // For MVP, just send.
                // TODO: Wire up sessionId from AppState
                
                let stream: AsyncThrowingStream<String, Error>
                
                if mode == .behavioral {
                     stream = StreamingClient.shared.streamBehavioralAnswer(question: q, context: c, sessionId: appState.currentSessionId)
                } else {
                     // Check for screen snapshot
                     stream = StreamingClient.shared.streamCodingAssist(question: q, code: self.code, screenSnapshot: self.screenSnapshotData, sessionId: appState.currentSessionId)
                }
                
                for try await chunk in stream {
                    DispatchQueue.main.async {
                        currentResponse += chunk
                    }
                }
                
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "assistant", content: currentResponse))
                    currentResponse = ""
                    isStreaming = false
                }
            } catch {
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "system", content: "Error: \(error.localizedDescription)"))
                    isStreaming = false
                }
            }
        }
    }
    
    func captureScreen() {
        if !ScreenCaptureManager.shared.checkScreenRecordingPermission() {
            // macOS requires permission. If we request it, it might pop up a dialog.
            _ = ScreenCaptureManager.shared.requestScreenRecordingPermission()
        }
        
        guard let cgImage = ScreenCaptureManager.shared.captureMainDisplay() else {
             messages.append(ChatMessage(role: "system", content: "Failed to capture screen. Check permissions."))
             return
        }
        
        // Convert to TIFF then PNG data for sending
        let bitmapRep = NSBitmapImageRep(cgImage: cgImage)
        self.screenSnapshotData = bitmapRep.representation(using: .png, properties: [:])
        
        Task {
            DispatchQueue.main.async {
                messages.append(ChatMessage(role: "system", content: "Scanning screen..."))
            }
            
            do {
                let text = try await OCRService.shared.recognizeText(from: cgImage)
                DispatchQueue.main.async {
                    if !self.context.isEmpty {
                        self.context += "\n\n--- Screen Context ---\n" + text
                    } else {
                        self.context = text
                    }
                    messages.append(ChatMessage(role: "system", content: "Screen context added."))
                }
            } catch {
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "system", content: "OCR Error: \(error.localizedDescription)"))
                }
            }
        }
    }
}
