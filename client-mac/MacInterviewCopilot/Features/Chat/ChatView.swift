import SwiftUI
import OpenAPIClient
import AppKit

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    @State private var question = ""
    @State private var context = ""
    @State private var code = ""
    @State private var messages: [ChatMessage] = []
    @State private var isStreaming = false
    @State private var currentResponse = ""
    @State private var mode: ChatMode = .agent
    @AppStorage("windowOpacity") var storedOpacity: Double = 1.0
    
    // Captured screenshot data
    @State private var screenSnapshotData: Data?
    
    // Multi-Display & Stealth
    @State private var displays: [CGDirectDisplayID] = []
    @State private var selectedDisplay: CGDirectDisplayID = CGMainDisplayID()
    @State private var isStealthMode: Bool = false
    
    enum ChatMode: String, CaseIterable, Identifiable {
        case behavioral = "Behavioral"
        case coding = "Coding"
        case systemDesign = "System Design"
        case meeting = "Meeting"
        case agent = "Agent (Swarm)"
        var id: String { self.rawValue }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            headerView
            messagesView
            Divider()
            inputSection
        }
        .onAppear {
            loadDisplays()
            loadHistory()
            AppState.shared.windowOpacity = storedOpacity
        }
        .onChange(of: messages.count) { _, _ in 
            saveHistory()
        }
        .onChange(of: isStreaming) { _, streaming in
            if !streaming { saveHistory() }
        }
        .onChange(of: AppState.shared.windowOpacity) { _, newOpacity in
           storedOpacity = newOpacity
        }
    }
    
    // MARK: - Header View
    
    @ViewBuilder
    private var headerView: some View {
        HStack {
            Text("Copilot")
                .font(.headline)
                .opacity(0.8)
            
            if displays.count > 1 {
                Picker("Display", selection: $selectedDisplay) {
                    ForEach(displays, id: \.self) { id in
                        Text("Display \(id)").tag(id)
                    }
                }
                .pickerStyle(MenuPickerStyle())
                .frame(width: 100)
            }
            
            Toggle("Stealth", isOn: $isStealthMode)
                .toggleStyle(.button)
                .help("Minimal UI for Zoom calls")
            
            Spacer()
            
            settingsMenu
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color.black.opacity(0.3))
        .cornerRadius(10)
        .padding(.horizontal, 8)
    }
    
    @ViewBuilder
    private var settingsMenu: some View {
        Menu {
            Toggle("Standalone (Offline)", isOn: Binding(
                get: { AppConfiguration.shared.useDirectOllama },
                set: { AppConfiguration.shared.useDirectOllama = $0 }
            ))
            Divider()
            Text("Mode: " + (AppConfiguration.shared.useDirectOllama ? "Direct Ollama" : "Cloud Backend"))
        } label: {
            Image(systemName: "gearshape")
                .imageScale(.large)
                .foregroundColor(.secondary)
        }
        .menuStyle(BorderlessButtonMenuStyle())
        .frame(width: 30)
    }
    
    // MARK: - Messages View
    
    @ViewBuilder
    private var messagesView: some View {
        ScrollViewReader { proxy in
            VStack(spacing: 0) {
                if !isStealthMode {
                    modePicker
                }
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(messages) { msg in
                            messageRow(msg)
                        }
                    }
                    .padding()
                    .onChange(of: messages.count) { _, _ in
                        scrollToBottom(proxy)
                    }
                    .onChange(of: currentResponse) { _, _ in
                         scrollToBottom(proxy)
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var modePicker: some View {
        Picker("Mode", selection: $mode) {
            ForEach(ChatMode.allCases) { mode in
                Text(mode.rawValue).tag(mode)
            }
        }
        .pickerStyle(SegmentedPickerStyle())
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
    
    @ViewBuilder
    private func messageRow(_ msg: ChatMessage) -> some View {
        HStack(alignment: .bottom, spacing: 12) {
            if msg.role == "user" {
                Spacer()
                userMessageBubble(msg.content)
            } else {
                assistantMessageBubble(msg.content)
                Spacer()
            }
        }
        .padding(.vertical, 4)
    }
    
    @ViewBuilder
    private func userMessageBubble(_ content: String) -> some View {
        Text(content)
            .padding(12)
            .background(LinearGradient(colors: [.blue, .cyan], startPoint: .leading, endPoint: .trailing))
            .foregroundColor(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
            .shadow(color: .blue.opacity(0.3), radius: 5, x: 0, y: 2)
    }
    
    @ViewBuilder
    private func assistantMessageBubble(_ content: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "sparkles")
                    .font(.caption2)
                    .foregroundColor(.cyan)
                Text("Assistant")
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            ForEach(parseMessage(content)) { block in
                switch block {
                case .text(let text):
                    Text(LocalizedStringKey(text))
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                        .fixedSize(horizontal: false, vertical: true)
                case .code(let code):
                    CodeBlockView(code: code)
                }
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
    
    // MARK: - Input Section
    
    @ViewBuilder
    private var inputSection: some View {
        VStack(spacing: 8) {
            if !isStealthMode {
                contextInput
            }
            inputArea
        }
    }
    
    @ViewBuilder
    private var contextInput: some View {
        switch mode {
        case .behavioral:
            contextEditor(placeholder: "Context/Job Description", text: $context, height: 60)
        case .coding:
            contextEditor(placeholder: "Paste Code Snippet (or Capture Split Screen)", text: $code, height: 80, monospaced: true)
        case .systemDesign:
            contextEditor(placeholder: "Scale/Requirements", text: $context, height: 60)
        case .meeting:
            contextEditor(placeholder: "Paste Transcript / Meeting Notes", text: $context, height: 60)
        case .agent:
            contextEditor(placeholder: "Goal / Context", text: $context, height: 60)
        }
    }
    
    @ViewBuilder
    private func contextEditor(placeholder: String, text: Binding<String>, height: CGFloat, monospaced: Bool = false) -> some View {
        TextEditor(text: text)
            .frame(height: height)
            .font(monospaced ? .monospaced(.body)() : .body)
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(Color.gray.opacity(0.5)))
            .overlay(
                Text(placeholder)
                    .foregroundColor(.gray)
                    .opacity(text.wrappedValue.isEmpty ? 0.5 : 0)
                    .padding(4),
                alignment: .topLeading
            )
    }
    
    @ViewBuilder
    private var inputArea: some View {
        HStack {
            screenshotThumbnail
            screenshotButton
            
            TextField("Ask a follow-up...", text: $question)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .onSubmit {
                    sendMessage()
                }
            
            sendButton
        }
        .padding()
        .background(Color.black.opacity(0.4))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
    
    @ViewBuilder
    private var screenshotThumbnail: some View {
        if let snapshot = screenSnapshotData, let nsImage = NSImage(data: snapshot) {
            Image(nsImage: nsImage)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: 50)
                .cornerRadius(4)
                .overlay(
                    Button(action: { screenSnapshotData = nil }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.red)
                            .background(Color.white.clipShape(Circle()))
                    }
                    .padding(2),
                    alignment: .topTrailing
                )
        }
    }
    
    @ViewBuilder
    private var screenshotButton: some View {
        Button(action: { takeScreenshot() }) {
            Image(systemName: "camera.viewfinder")
                .font(.system(size: 20))
                .foregroundColor(.blue)
        }
        .buttonStyle(PlainButtonStyle())
        .help("Silent Screenshot")
    }
    
    @ViewBuilder
    private var sendButton: some View {
        if isStreaming {
            ProgressView()
                .scaleEffect(0.5)
        } else {
            Button(action: { sendMessage() }) {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.blue)
            }
            .disabled(question.isEmpty && screenSnapshotData == nil)
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    // MARK: - Helper Methods
    
    private func scrollToBottom(_ proxy: ScrollViewProxy) {
        if let lastId = messages.last?.id {
            withAnimation {
                proxy.scrollTo(lastId, anchor: .bottom)
            }
        }
    }
    
    private func takeScreenshot() {
        if let window = NSApplication.shared.windows.first(where: { $0.isVisible && $0.level == .floating }) {
            let originalAlpha = window.alphaValue
            window.alphaValue = 0.0
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                 if let image = ScreenCaptureService.shared.captureScreen(displayId: self.selectedDisplay) {
                      if let tiff = image.tiffRepresentation,
                         let bitmap = NSBitmapImageRep(data: tiff),
                         let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.7]) {
                          self.screenSnapshotData = jpeg
                      }
                 }
                 window.alphaValue = originalAlpha
            }
        }
    }
    
    private func loadDisplays() {
        self.displays = ScreenCaptureService.shared.listDisplays()
        if self.displays.contains(CGMainDisplayID()) {
            self.selectedDisplay = CGMainDisplayID()
        } else if let first = self.displays.first {
            self.selectedDisplay = first
        }
    }
    
    private func sendMessage() {
        guard !question.isEmpty || screenSnapshotData != nil else { return }
        
        let userMsg = ChatMessage(role: "user", content: question)
        messages.append(userMsg)
        
        let textToSend = question
        let imageToSend = screenSnapshotData
        let currentMode = mode
        let currentContext = context
        let currentCode = code
        
        question = ""
        screenSnapshotData = nil
        
        isStreaming = true
        currentResponse = ""
        
        Task {
            messages.append(ChatMessage(role: "assistant", content: "")) 
            
            do {
                let stream: AsyncThrowingStream<String, Error>
                
                if currentMode == .agent || currentMode == .meeting {
                     let prefix = (currentMode == .meeting ? "[Meeting Mode] " : "")
                     let fullContext = prefix + "Context: \(currentContext)\nCode: \(currentCode)"
                     stream = StreamingClient.shared.streamAgentChat(message: textToSend, context: fullContext, image: imageToSend)
                } else if let imageData = imageToSend {
                     stream = StreamingClient.shared.streamCodingAssist(question: textToSend, code: currentCode, screenSnapshot: imageData)
                } else {
                    switch currentMode {
                    case .behavioral:
                        stream = StreamingClient.shared.streamBehavioralAnswer(question: textToSend, context: currentContext)
                    case .coding:
                        stream = StreamingClient.shared.streamCodingAssist(question: textToSend, code: currentCode, screenSnapshot: nil)
                    case .systemDesign:
                        stream = StreamingClient.shared.streamSystemDesign(problem: textToSend, context: currentContext)
                    case .meeting, .agent:
                        stream = StreamingClient.shared.streamAgentChat(message: textToSend, context: currentContext) 
                    }
                }
                
                for try await chunk in stream {
                    currentResponse += chunk
                    if !messages.isEmpty {
                        let lastIdx = messages.count - 1
                        messages[lastIdx] = ChatMessage(role: "assistant", content: currentResponse)
                    }
                }
            } catch {
                currentResponse += "\nError: \(error.localizedDescription)"
                if !messages.isEmpty {
                    let lastIdx = messages.count - 1
                    messages[lastIdx] = ChatMessage(role: "assistant", content: currentResponse)
                }
            }
            
            isStreaming = false
        }
    }
    
    // MARK: - Persistence
    
    private func saveHistory() {
        PersistenceService.shared.saveHistory(messages)
    }
    
    private func loadHistory() {
        self.messages = PersistenceService.shared.loadHistory()
    }
}
