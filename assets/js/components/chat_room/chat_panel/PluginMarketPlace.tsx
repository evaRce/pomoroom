import React, { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Puzzle, Timer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "../../../../components-shadcn/ui/dialog";
import { Button } from "../../../../components-shadcn/ui/button"
import { cn } from "../../../../lib/utils";
import pluginMarketPlaceText from "./pluginMarketPlaceText";

export interface AvailablePlugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconComponent?: React.ReactNode;
}

export interface InstalledPlugin {
  id: string;
  name: string;
  icon: string;
}

type AvailablePluginApiResponse = {
  data: Omit<AvailablePlugin, "iconComponent">[];
};

const iconComponentMap: Record<string, React.ReactNode> = {
  pomodoro: <Timer className="h-6 w-6 text-sky-500" />,
  kanban: <LayoutGrid className="h-6 w-6 text-green-500" />,
};

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
  const [availablePlugins, setAvailablePlugins] = useState<AvailablePlugin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadPlugins = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/plugins", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(pluginMarketPlaceText.fetchError);
        }

        const payload = (await response.json()) as AvailablePluginApiResponse;
        const plugins = Array.isArray(payload?.data) ? payload.data : [];

        if (!cancelled) {
          setAvailablePlugins(
            plugins.map((plugin) => ({
              ...plugin,
              iconComponent: iconComponentMap[plugin.id],
            }))
          );
        }
      } catch (_error) {
        if (!cancelled) {
          setLoadError(pluginMarketPlaceText.loadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPlugins();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const isInstalled = (pluginId: string) => installedPlugins.some((plugin) => plugin.id === pluginId);
  const hasPlugins = useMemo(() => availablePlugins.length > 0, [availablePlugins.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg mx-auto md:max-w-xl bg-gray-50">
        <DialogHeader>
          <DialogTitle>{pluginMarketPlaceText.title}</DialogTitle>
          <DialogDescription>
            {pluginMarketPlaceText.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLoading && <p className="text-sm text-slate-500">{pluginMarketPlaceText.loading}</p>}
          {loadError && <p className="text-sm text-red-500">{loadError}</p>}
          {!isLoading && !loadError && !hasPlugins && (
            <p className="text-sm text-slate-500">{pluginMarketPlaceText.empty}</p>
          )}
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
                    {plugin.iconComponent || <Puzzle className="h-6 w-6 text-slate-500" />}
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
                          {pluginMarketPlaceText.uninstall}
                        </Button>
                      ) : (
                          <Button
                            size="sm"
                            className="h-8 text-xs !font-extrabold text-white bg-green-600 hover:bg-green-700"
                            onClick={() => onInstallPlugin(plugin)}
                          >
                            {pluginMarketPlaceText.install}
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
