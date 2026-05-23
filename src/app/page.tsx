
import Link from "next/link";
import { 
  Layers, 
  FileStack, 
  Image as ImageIcon, 
  Calculator, 
  Printer, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tools = [
  {
    title: "Muralis",
    description: "Generador de cuadrículas para murales gigantes. Divide cualquier imagen en hojas imprimibles con solapes técnicos.",
    icon: <Layers className="h-8 w-8 text-primary" />,
    href: "/muralis",
    status: "active",
    badge: "Popular"
  },
  {
    title: "PDF Master",
    description: "Combina, separa y optimiza archivos PDF para impresión masiva. Incluye numeración automática.",
    icon: <FileStack className="h-8 w-8 text-blue-500" />,
    href: "#",
    status: "coming-soon",
    badge: "Próximamente"
  },
  {
    title: "Resizer Pro",
    description: "Cambia el tamaño de imágenes a DPI específico para gigantografías sin pérdida de calidad visual.",
    icon: <ImageIcon className="h-8 w-8 text-orange-500" />,
    href: "#",
    status: "coming-soon",
    badge: "Próximamente"
  },
  {
    title: "Costo Print",
    description: "Calculadora avanzada de presupuestos basada en cobertura de tinta, tipo de papel y tiempo de máquina.",
    icon: <Calculator className="h-8 w-8 text-emerald-500" />,
    href: "#",
    status: "coming-soon",
    badge: "Próximamente"
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-body">
      {/* Navbar Minimalista */}
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Printer className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-headline font-black tracking-tighter text-foreground">
            REPRO<span className="text-primary">HUB</span>
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">Soporte</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero Section */}
        <div className="max-w-3xl mb-16 space-y-4">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-none">
            Suite Profesional de Reprografía
          </Badge>
          <h1 className="text-5xl md:text-6xl font-headline font-black tracking-tighter leading-[0.9] text-foreground">
            Herramientas digitales para <span className="text-primary">expertos en impresión.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-2xl">
            Optimiza tu flujo de trabajo con nuestra colección de utilidades diseñadas específicamente para centros de copiado y artes gráficas.
          </p>
        </div>

        {/* Grid de Herramientas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {tools.map((tool) => (
            <Link 
              key={tool.title} 
              href={tool.href}
              className={tool.status === 'coming-soon' ? 'pointer-events-none' : ''}
            >
              <Card className={`group relative h-full transition-all duration-300 border-2 ${tool.status === 'active' ? 'hover:border-primary hover:shadow-2xl hover:shadow-primary/10 cursor-pointer' : 'opacity-60 bg-muted/30 border-dashed'}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-8">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl inline-flex transition-transform group-hover:scale-110 duration-300 ${tool.status === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
                      {tool.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-2xl font-headline font-bold">{tool.title}</CardTitle>
                        <Badge variant={tool.status === 'active' ? 'default' : 'outline'} className="font-bold">
                          {tool.badge}
                        </Badge>
                      </div>
                      <CardDescription className="text-base text-muted-foreground leading-snug pr-8">
                        {tool.description}
                      </CardDescription>
                    </div>
                  </div>
                  {tool.status === 'active' && (
                    <div className="bg-primary/10 p-2 rounded-full transform group-hover:translate-x-2 transition-transform">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </CardHeader>
                {tool.status === 'active' && (
                  <div className="absolute bottom-4 right-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">Abrir Aplicación</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground font-medium">© 2024 ReproHub - Herramientas para el mundo real.</p>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-black uppercase tracking-widest">Nuevas herramientas cada mes</span>
          </div>
        </div>
      </main>
    </div>
  );
}
