import { useState } from "react";
import { DocumentUpload } from "./DocumentUpload";

export const ANTEPROJECT_CATEGORIES = [
  { value: "anteproyecto", label: "Anteproyecto general", description: "Documento rector del anteproyecto", formats: "PDF" },
  { value: "planta_conjunto", label: "Planta de conjunto", description: "Implantación general de la villa y el solar", formats: "PDF o DWG" },
  { value: "planta_nivel", label: "Plantas por nivel", description: "Planta baja, niveles superiores y cubiertas", formats: "PDF o DWG" },
  { value: "elevaciones", label: "Elevaciones", description: "Fachadas y elevaciones principales", formats: "PDF o DWG" },
  { value: "secciones", label: "Secciones", description: "Cortes longitudinales y transversales", formats: "PDF o DWG" },
  { value: "curvas_nivel", label: "Curvas de nivel", description: "Topografía, niveles y referencias del terreno", formats: "PDF o DWG" },
  { value: "memoria_descriptiva", label: "Memoria descriptiva", description: "Criterios, alcance y descripción arquitectónica", formats: "PDF o DOCX" },
] as const;

const ANNEX_CATEGORY = {
  value: "anexos",
  label: "Anexos",
  description: "Imágenes, modelos, referencias y archivos complementarios",
  formats: "JPG, PNG, IFC, RVT, OBJ, ZIP u otros",
} as const;

type UploadCategory = (typeof ANTEPROJECT_CATEGORIES)[number]["value"] | typeof ANNEX_CATEGORY.value;

export function ArchitectAnteprojectUploadPanel({ projectId, onUploaded }: { projectId: string; onUploaded?: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<UploadCategory>("planta_conjunto");
  const selected = selectedCategory === ANNEX_CATEGORY.value ? ANNEX_CATEGORY : ANTEPROJECT_CATEGORIES.find((category) => category.value === selectedCategory) ?? ANTEPROJECT_CATEGORIES[0];
  const allCategories = [...ANTEPROJECT_CATEGORIES, ANNEX_CATEGORY];

  return (
    <section className="space-y-5">
      <div className="glass-panel bg-white p-6 md:p-7 border border-outline-variant/30">
        <div className="flex items-start gap-4">
          <span className="material-symbols-outlined text-3xl text-primary">architecture</span>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Paquete de anteproyecto</p>
            <h2 className="text-xl font-bold text-on-surface mt-2">Documentación requerida por categoría</h2>
            <p className="text-sm text-secondary mt-2">Carga cada archivo en su grupo para que Revisión Técnica pueda revisar el expediente de forma ordenada. Los PDF y CAD quedan versionados y vinculados a Villa Demo 1.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-6">
          {ANTEPROJECT_CATEGORIES.map((category) => (
            <button type="button" key={category.value} onClick={() => setSelectedCategory(category.value)} className={`text-left rounded-2xl border p-4 transition-colors ${selectedCategory === category.value ? "border-primary bg-primary/5" : "border-outline-variant/30 hover:border-primary/40"}`}>
              <div className="flex items-start justify-between gap-3"><span className="material-symbols-outlined text-primary">description</span><span className="text-[10px] uppercase tracking-[0.14em] text-secondary">{category.formats}</span></div>
              <p className="text-sm font-semibold text-on-surface mt-3">{category.label}</p>
              <p className="text-xs text-secondary mt-1">{category.description}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="glass-panel bg-white p-6 md:p-7 border border-outline-variant/30">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><p className="text-xs uppercase tracking-[0.18em] text-secondary">Anexos del expediente</p><h3 className="text-xl font-bold text-on-surface mt-2">Imágenes, modelos y referencias</h3><p className="text-sm text-secondary mt-2">Los anexos se conservan separados de la documentación formal para no mezclarlos con los planos revisables.</p></div>
          <button type="button" onClick={() => setSelectedCategory(ANNEX_CATEGORY.value)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${selectedCategory === ANNEX_CATEGORY.value ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}><span className="material-symbols-outlined text-base align-middle mr-1">attachment</span>Cargar anexos</button>
        </div>
        {selectedCategory === ANNEX_CATEGORY.value && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-5 text-sm text-secondary"><strong className="text-primary">Anexos seleccionados:</strong> {ANNEX_CATEGORY.formats}.</div>}
        <DocumentUpload projectId={projectId} defaultCategory={selectedCategory} categories={allCategories.map(({ value, label }) => ({ value, label }))} titleLabel={`Título · ${selected.label}`} accept={selectedCategory === ANNEX_CATEGORY.value ? ".pdf,.dwg,.dxf,.doc,.docx,.jpg,.jpeg,.png,.ifc,.rvt,.obj,.fbx,.glb,.gltf,.zip" : ".pdf,.dwg,.dxf,.doc,.docx"} onUploaded={onUploaded} />
      </div>
    </section>
  );
}
