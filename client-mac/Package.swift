// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MacInterviewCopilot",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "MacInterviewCopilot",
            targets: ["MacInterviewCopilot"]
        )
    ],
    dependencies: [
        // Local dependency for the generated API client
        .package(path: "MacInterviewCopilot/Core/Networking/OpenAPIClient")
    ],
    targets: [
        .executableTarget(
            name: "MacInterviewCopilot",
            dependencies: [
                .product(name: "OpenAPIClient", package: "OpenAPIClient")
            ],
            path: "MacInterviewCopilot",
            exclude: [
                "Info.plist",
                "MacInterviewCopilot.entitlements",
                "Core/Networking/OpenAPIClient"
            ],
            resources: [
                .process("Resources")
            ]
        ),
        .testTarget(
            name: "MacInterviewCopilotTests",
            dependencies: ["MacInterviewCopilot"],
            path: "Tests"
        )
    ]
)
