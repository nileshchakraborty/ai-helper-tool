import SwiftUI
import AppKit

public enum MessageBlock: Identifiable {
    case text(String)
    case code(String)
    
    public var id: String {
        switch self {
        case .text(let s): return "text-\(s.hashValue)"
        case .code(let s): return "code-\(s.hashValue)"
        }
    }
}

public func parseMessage(_ content: String) -> [MessageBlock] {
    var blocks: [MessageBlock] = []
    let components = content.components(separatedBy: "```")
    
    for (index, component) in components.enumerated() {
        if index % 2 == 0 {
            // Text segment
            let trimmed = component.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                blocks.append(.text(component))
            }
        } else {
            // Code segment
            var code = component
            // Attempt to strip language identifier (common pattern: ```swift\nCode```)
            if let firstLineEnd = code.firstIndex(of: "\n") {
                 code = String(code.suffix(from: firstLineEnd).dropFirst())
            }
            blocks.append(.code(code))
        }
    }
    return blocks
}


public struct CodeBlockView: View {
    let code: String
    @State private var isCopied = false
    
    public init(code: String) {
        self.code = code
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("CODE")
                    .font(.system(size: 10))
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
                Spacer()
                Button(action: {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(code, forType: .string)
                    isCopied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { isCopied = false }
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        Text(isCopied ? "Copied" : "Copy")
                    }
                    .font(.system(size: 10))
                    .foregroundColor(.white)
                }
                .buttonStyle(.plain)
            }
            .padding(8)
            .background(Color.white.opacity(0.1))
            
            Text(code)
                .font(.monospaced(.body)())
                .foregroundColor(.white) // Green matrix style?
                .padding(12)
                .background(Color.black.opacity(0.3))
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .cornerRadius(8)
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.white.opacity(0.1), lineWidth: 1))
        .padding(.vertical, 4)
    }
}
