import React from "react";
import { LayoutGrid, Timer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "../../../../components-shadcn/ui/dialog";
import { Button } from "../../../../components-shadcn/ui/button"
import { cn } from "../../../../lib/utils";

export interface AvailablePlugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconComponent: React.ReactNode;
}

export interface InstalledPlugin {
  id: string;
  name: string;
  icon: string;
}

const availablePlugins: AvailablePlugin[] = [
  {
    id: "pomodoro",
    name: "Temporizador Pomodoro",
    description:
      "Temporizador compartido para sesiones de trabajo y descanso dentro del chat.",
    icon: "⏱️",
    iconComponent: <Timer className="h-6 w-6 text-sky-500" />,
  },
  {
    id: "kanban",
    name: "Tablero Kanban",
    description:
      "Tablero compartido para organizar tareas en columnas To Do, In Progress y Done.",
    icon: "📋",
    iconComponent: <LayoutGrid className="h-6 w-6 text-green-500" />,
  },
];

interface PluginMarketPlaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installedPlugins: InstalledPlugin[];
  onInstallPlugin: (plugin: AvailablePlugin) => void;
  onUninstallPlugin: (pluginId: string) => void;
}

export default function PluginMarketPlace({
  open,
  onOpenChange,
  installedPlugins,
  onInstallPlugin,
  onUninstallPlugin,
}: PluginMarketPlaceProps) {
  const isInstalled = (pluginId: string) => installedPlugins.some((plugin) => plugin.id === pluginId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg mx-auto md:max-w-xl bg-gray-50">
        <DialogHeader>
          <DialogTitle>Tienda de Plugins</DialogTitle>
          <DialogDescription>
            Instala plugins compartidos para esta conversacion.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {availablePlugins.map((plugin) => {
            const installed = isInstalled(plugin.id);
            return (
              <div
                key={plugin.id}
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border transition-all",
                  installed
                    ? "border-sky-300 bg-sky-100"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-200"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-200 self-center">
                    {plugin.iconComponent}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-800">{plugin.name}</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{plugin.description}</p>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col justify-start">
                    <div className="shrink-0">
                      {installed ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs !font-extrabold text-red-400 bg-gray-50 border-red-300 hover:bg-red-50 hover:border-red-200"
                          onClick={() => onUninstallPlugin(plugin.id)}
                        >
                          Desinstalar
                        </Button>
                      ) : (
                          <Button
                            size="sm"
                            className="h-8 text-xs !font-extrabold text-white bg-green-600 hover:bg-green-700"
                            onClick={() => onInstallPlugin(plugin)}
                          >
                            Instalar
                          </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
