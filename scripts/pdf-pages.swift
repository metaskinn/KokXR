import PDFKit

let args = CommandLine.arguments
guard args.count == 4, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
    print("open failed")
    exit(1)
}
let from = Int(args[2])!
let to = min(Int(args[3])!, doc.pageCount - 1)
print("pages: \(doc.pageCount)")
for i in from...to {
    print("=== page \(i + 1)")
    print(doc.page(at: i)?.string ?? "")
}
