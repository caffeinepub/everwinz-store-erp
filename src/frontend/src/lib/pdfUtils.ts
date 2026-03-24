function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function downloadPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
) {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  );

  // @ts-ignore
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("EVERWINZ STRUCTURAL SYSTEMS PVT LTD", 105, 15, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Your Trusted Engineering Partner", 105, 21, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 32);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 38);
  // @ts-ignore
  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 44,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(
    `${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
