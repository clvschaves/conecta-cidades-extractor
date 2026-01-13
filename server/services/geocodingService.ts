import { makeRequest } from "../_core/map";

/**
 * Serviço de geocodificação de endereços usando Google Maps API
 */

export async function geocodificarEndereco(
  endereco: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await makeRequest("/maps/api/geocode/json", {
      address: endereco,
    }) as any;

    if (response.status === "OK" && response.results && response.results.length > 0) {
      const location = response.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }

    return null;
  } catch (error) {
    console.error(`Erro ao geocodificar endereço "${endereco}":`, error);
    return null;
  }
}

export async function geocodificarLote(
  enderecos: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { latitude: number; longitude: number }>> {
  const resultado = new Map<string, { latitude: number; longitude: number }>();
  const total = enderecos.length;

  for (let i = 0; i < enderecos.length; i++) {
    const endereco = enderecos[i];
    
    if (onProgress) {
      onProgress(i + 1, total);
    }

    const coords = await geocodificarEndereco(endereco);
    if (coords) {
      resultado.set(endereco, coords);
    }

    // Delay para respeitar rate limits da API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return resultado;
}
