import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useEditorStore } from '@/store/editorStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Sparkles, Image as ImageIcon, Video, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export const EffectsLibrary = () => {
  const { addAsset } = useEditorStore();
  const [textContent, setTextContent] = useState('Texto de ejemplo');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontFamily, setFontFamily] = useState('Arial');

  const handleAddText = () => {
    const textAsset = {
      id: `text-${Date.now()}`,
      type: 'text' as const,
      name: textContent.substring(0, 20),
      url: '', // Not needed for text
      duration: 0,
      textProperties: {
        content: textContent,
        fontSize,
        color: textColor,
        fontFamily,
      },
    };

    addAsset(textAsset);
    toast.success('Texto agregado a la biblioteca');
  };

  const imageEffects = [
    { id: 'blur', name: 'Desenfoque', icon: '🌫️', filter: 'blur(5px)' },
    { id: 'grayscale', name: 'Blanco y Negro', icon: '⚫', filter: 'grayscale(100%)' },
    { id: 'sepia', name: 'Sepia', icon: '🟤', filter: 'sepia(100%)' },
    { id: 'brightness', name: 'Brillo', icon: '☀️', filter: 'brightness(150%)' },
    { id: 'contrast', name: 'Contraste', icon: '◐', filter: 'contrast(150%)' },
    { id: 'saturate', name: 'Saturación', icon: '🎨', filter: 'saturate(200%)' },
    { id: 'hue-rotate', name: 'Rotación de Color', icon: '🌈', filter: 'hue-rotate(90deg)' },
    { id: 'invert', name: 'Invertir', icon: '🔄', filter: 'invert(100%)' },
  ];

  const videoEffects = [
    { id: 'fade-in', name: 'Fade In', icon: '↗️', description: 'Aparición gradual' },
    { id: 'fade-out', name: 'Fade Out', icon: '↘️', description: 'Desaparición gradual' },
    { id: 'zoom-in', name: 'Zoom In', icon: '🔍', description: 'Acercamiento' },
    { id: 'zoom-out', name: 'Zoom Out', icon: '🔎', description: 'Alejamiento' },
    { id: 'slide-left', name: 'Deslizar Izq', icon: '⬅️', description: 'Desliza desde la derecha' },
    { id: 'slide-right', name: 'Deslizar Der', icon: '➡️', description: 'Desliza desde la izquierda' },
  ];

  const tiktokEffects = [
    { id: 'glitch', name: 'Glitch', icon: '⚡', description: 'Efecto de distorsión glitch', animation: 'glitch' },
    { id: 'rgb-split', name: 'RGB Split', icon: '🌈', description: 'Separación de canales RGB', filter: 'rgb-split' },
    { id: 'shake', name: 'Shake', icon: '📳', description: 'Vibración rápida', animation: 'shake-intense' },
    { id: 'zoom-punch', name: 'Zoom Punch', icon: '💥', description: 'Zoom explosivo', animation: 'zoom-punch' },
    { id: 'flash-strobe', name: 'Flash', icon: '💡', description: 'Destello estroboscópico', animation: 'flash-strobe' },
    { id: 'chromatic', name: 'Chromatic', icon: '🎨', description: 'Aberración cromática', filter: 'chromatic' },
    { id: 'distortion', name: 'Distortion', icon: '🌀', description: 'Distorsión de onda', filter: 'distortion' },
    { id: 'vhs', name: 'VHS', icon: '📼', description: 'Efecto retro VHS', filter: 'vhs' },
  ];

  const textEffects = [
    { id: 'bounce', name: 'Rebote', icon: '⬆️', animation: 'bounce' },
    { id: 'pulse', name: 'Pulso', icon: '💓', animation: 'pulse' },
    { id: 'shake', name: 'Vibrar', icon: '📳', animation: 'shake' },
    { id: 'glow', name: 'Resplandor', icon: '✨', animation: 'glow' },
    { id: 'typewriter', name: 'Máquina de escribir', icon: '⌨️', animation: 'typewriter' },
  ];

  const handleAddEffect = (effect: any, type: 'image' | 'video' | 'text') => {
    const effectAsset = {
      id: `effect-${Date.now()}`,
      type: 'effect' as const,
      name: effect.name,
      url: '',
      duration: 0,
      effectProperties: {
        effectId: effect.id,
        effectType: type,
        filter: effect.filter,
        animation: effect.animation,
      },
    };

    addAsset(effectAsset);
    toast.success(`Efecto "${effect.name}" agregado`);
  };

  return (
    <div className="w-80 bg-panel-content border-r border-border flex flex-col">
      <div className="p-4 bg-panel-header border-b border-border">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Efectos y Textos
        </h2>
      </div>

      <Tabs defaultValue="text" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid grid-cols-5">
          <TabsTrigger value="text" className="text-xs">
            <Type className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="text-xs">
            <Sparkles className="w-3 h-3" />
          </TabsTrigger>
          <TabsTrigger value="image" className="text-xs">
            <ImageIcon className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs">
            <Video className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="text-fx" className="text-xs">
            <Palette className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="text" className="p-4 space-y-4 mt-0">
            <Card className="p-4 space-y-4">
              <h3 className="font-medium text-sm">Agregar Texto</h3>
              
              <div className="space-y-2">
                <Label className="text-xs">Contenido</Label>
                <Input
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Escribe tu texto..."
                  className="h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="text-xs">Tamaño</Label>
                  <Input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    min={12}
                    max={200}
                    className="h-8"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Color</Label>
                  <Input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Fuente</Label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full h-8 px-3 rounded-md bg-input border border-border text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Comic Sans MS">Comic Sans MS</option>
                  <option value="Impact">Impact</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                </select>
              </div>

              <Button onClick={handleAddText} className="w-full">
                <Type className="w-4 h-4 mr-2" />
                Agregar Texto
              </Button>
            </Card>

            <div className="text-xs text-muted-foreground px-1">
              El texto se agregará a tu biblioteca y podrás arrastrarlo al timeline.
            </div>
          </TabsContent>

          <TabsContent value="tiktok" className="p-4 space-y-4 mt-0">
            <h3 className="font-medium text-sm mb-2">Efectos TikTok / DJ</h3>
            <div className="space-y-2">
              {tiktokEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className="p-3 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => handleAddEffect(effect, 'video')}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{effect.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{effect.name}</div>
                      <div className="text-xs text-muted-foreground">{effect.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-xs text-muted-foreground px-1 mt-4">
              Efectos populares de TikTok y videos de DJ remixes para hacer tus videos más dinámicos.
            </div>
          </TabsContent>

          <TabsContent value="image" className="p-4 space-y-4 mt-0">
            <h3 className="font-medium text-sm mb-2">Efectos de Imagen</h3>
            <div className="grid grid-cols-2 gap-2">
              {imageEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className="p-3 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => handleAddEffect(effect, 'image')}
                >
                  <div className="text-2xl mb-1">{effect.icon}</div>
                  <div className="text-xs font-medium">{effect.name}</div>
                </Card>
              ))}
            </div>
            <div className="text-xs text-muted-foreground px-1 mt-4">
              Haz clic en un efecto para agregarlo a tu biblioteca. Luego podrás aplicarlo a tus imágenes.
            </div>
          </TabsContent>

          <TabsContent value="video" className="p-4 space-y-4 mt-0">
            <h3 className="font-medium text-sm mb-2">Transiciones y Efectos</h3>
            <div className="space-y-2">
              {videoEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className="p-3 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => handleAddEffect(effect, 'video')}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{effect.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{effect.name}</div>
                      <div className="text-xs text-muted-foreground">{effect.description}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-xs text-muted-foreground px-1 mt-4">
              Estos efectos se pueden aplicar a clips de video e imágenes para crear transiciones suaves.
            </div>
          </TabsContent>

          <TabsContent value="text-fx" className="p-4 space-y-4 mt-0">
            <h3 className="font-medium text-sm mb-2">Efectos de Texto</h3>
            <div className="grid grid-cols-2 gap-2">
              {textEffects.map((effect) => (
                <Card
                  key={effect.id}
                  className="p-3 cursor-pointer hover:bg-accent/10 transition-colors"
                  onClick={() => handleAddEffect(effect, 'text')}
                >
                  <div className="text-2xl mb-1">{effect.icon}</div>
                  <div className="text-xs font-medium">{effect.name}</div>
                </Card>
              ))}
            </div>
            <div className="text-xs text-muted-foreground px-1 mt-4">
              Aplica estos efectos a tus textos para hacerlos más dinámicos y llamativos.
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
