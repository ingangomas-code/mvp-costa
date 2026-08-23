import { Document as PdfDocument, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfDocumentCanvasProps {
  file: string;
  pageNumber: number;
  onPageCount: (pageCount: number) => void;
  onError: (error: Error) => void;
}

export default function PdfDocumentCanvas({
  file,
  pageNumber,
  onPageCount,
  onError,
}: PdfDocumentCanvasProps) {
  return (
    <PdfDocument
      file={file}
      onLoadSuccess={({ numPages }) => onPageCount(numPages)}
      onLoadError={onError}
      onSourceError={onError}
      loading={<div className="p-16 text-secondary">Cargando PDF…</div>}
      error={<div className="p-16 text-center text-error">No fue posible renderizar este PDF.</div>}
    >
      <Page pageNumber={pageNumber} width={760} />
    </PdfDocument>
  );
}
