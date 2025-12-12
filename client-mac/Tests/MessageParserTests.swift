import XCTest
@testable import MacInterviewCopilotLib

final class MessageParserTests: XCTestCase {
    
    func testParseSimpleText() {
        let content = "Hello World"
        let blocks = parseMessage(content)
        XCTAssertEqual(blocks.count, 1)
        
        guard case .text(let t) = blocks.first! else {
            XCTFail("Expected text block")
            return
        }
        XCTAssertEqual(t, "Hello World")
    }
    
    func testParseCodeBlock() {
        // Typical LLM usage: text then code
        let content = "Here is code:\n```swift\nprint(\"Hello\")\n```\nDone."
        let blocks = parseMessage(content)
        
        // Expected: Text, Code, Text
        XCTAssertEqual(blocks.count, 3)
        
        // Block 0
        if case .text(let t) = blocks[0] {
            XCTAssertTrue(t.contains("Here is code"))
        } else { XCTFail("Block 0 should be text") }
        
        // Block 1 (Code)
        if case .code(let c) = blocks[1] {
            // Parser logic strips first line if it's language identifier?
            // Logic: "if let firstLineEnd = code.firstIndex(of: "\n") { code = ... dropFirst() }"
            XCTAssertTrue(c.contains("print"), "Code content mismatch: \(c)")
            XCTAssertFalse(c.contains("swift"), "Language id should be stripped")
        } else { XCTFail("Block 1 should be code") }
        
        // Block 2
        if case .text(let t) = blocks[2] {
            XCTAssertTrue(t.contains("Done"))
        } else { XCTFail("Block 2 should be text") }
    }
    
    func testParseIncompleteCode() {
        // Edge case: Unclosed code block? parser uses split("```")
        let content = "Start\n```\nUnclosed"
        let blocks = parseMessage(content)
        // split gives: "Start\n", "\nUnclosed"
        // count 2. index 1 is code.
        XCTAssertEqual(blocks.count, 2)
        if case .code = blocks[1] {
            // Pass
        } else {
            XCTFail("Expected unclosed block to be treated as code")
        }
    }
}
