app.post("/api/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    const pdfDoc = new PDF({
      name: req.body.name,
      filename: req.file.filename,
      path: req.file.path,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/${req.file.filename}`,
    });

    await pdfDoc.save();

    res.status(201).json({
      message: "Tải lên thành công",
      file: pdfDoc,
    });
  } catch (error) {}
});

app.get("/api/pdfs", async (req, res) => {
  try {
    const pdfs = await PDF.find().sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ error: "Lỗi khi lấy danh sách PDF" });
  }
});
