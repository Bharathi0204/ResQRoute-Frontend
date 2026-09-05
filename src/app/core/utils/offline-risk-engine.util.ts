import { AIRiskEvaluation, RiskLevel } from '../models/logistics.model';

export function evaluateOfflineRouteRisk(
  origin: string,
  destination: string,
  cargoType: string,
  priority: string,
  weightKg: number
): AIRiskEvaluation {
  const normOrigin = (origin || '').toLowerCase();
  const normDest = (destination || '').toLowerCase();

  let baseScore = 25;
  let summary = '';
  let factors: string[] = [];
  let recRoute = `${origin} → ${destination} (Direct National Highway)`;
  let advisory = 'Maintain standard highland driving safety.';
  let weather = 'Partly cloudy, visibility 8 km.';

  if (
    (normOrigin.includes('guwahati') && normDest.includes('silchar')) ||
    (normOrigin.includes('silchar') && normDest.includes('guwahati'))
  ) {
    baseScore = 68;
    summary = 'NH-6 Meghalaya ridge section is experiencing mountain mist and intermittent slow transit near Lumshnong. High priority corridor.';
    factors = [
      'Steep grades on Meghalaya plateau ascent (NH-6)',
      'Wet road surface with reduced braking friction near Sonapur tunnel',
      'Heavy commercial carrier convoy queue during peak relief hours'
    ];
    recRoute = 'NH-6 via Lumshnong — Sonapur Tunnel bypass';
    advisory = 'Maintain 40 km/h on wet ridge descents. Keep low gear on steep passes.';
    weather = 'Light to moderate rainfall (28mm/h), mountain fog.';
  } else if (
    (normOrigin.includes('siliguri') && normDest.includes('gangtok')) ||
    (normOrigin.includes('gangtok') && normDest.includes('siliguri'))
  ) {
    baseScore = 58;
    summary = 'NH-10 Teesta River corridor active. Single-lane controlled movement near 29th Mile sliding zone.';
    factors = [
      'Teesta river water level moderately high',
      'Periodic slope clearing by BRO at 29th Mile checkpoint',
      'Narrow bends requiring active convoy spacing'
    ];
    recRoute = 'NH-10 via Sevoke — Rangpo (or alternate via Lava-Algarah)';
    advisory = 'Verify BRO clearance status at Rangpo border checkpoint before ascending.';
    weather = 'Intermittent drizzle, riverbank mist.';
  } else if (
    (normOrigin.includes('shillong') && normDest.includes('aizawl')) ||
    (normOrigin.includes('aizawl') && normDest.includes('shillong'))
  ) {
    baseScore = 52;
    summary = 'NH-6 to NH-306 transit corridor stable. Moderate curve gradients through southern Assam.';
    factors = [
      'Single-lane sections on southern highway stretch',
      'Variable road shoulders near district borders'
    ];
    recRoute = 'NH-6 through Silchar bypass onto NH-306 Aizawl link';
    advisory = 'Inspect truck tie-downs at Silchar border post before entering Mizoram hills.';
    weather = 'Overcast, good visibility.';
  } else if (normOrigin.includes('kohima') || normDest.includes('kohima') || normDest.includes('dimapur')) {
    baseScore = 48;
    summary = 'NH-29 4-lane section open. Cautious transit on Kohima bypass ridge.';
    factors = [
      'Rockfall nets installed near Paglapahar',
      'Moderate truck traffic on Kohima ascent'
    ];
    recRoute = 'NH-29 standard corridor';
    advisory = 'Headlights required in evening mountain fog.';
    weather = 'Scattered clouds, clear roadway.';
  } else {
    baseScore = 32;
    summary = `Standard mountain transit route between ${origin} and ${destination}. Corridor open for relief freight.`;
    factors = [
      'Normal hill highway traffic',
      'Standard gradient curve cautionary alerts'
    ];
    recRoute = `Primary Corridor from ${origin} to ${destination}`;
    advisory = 'Standard precautions. Ensure communication check-in every 50 km.';
    weather = 'Clear weather, visibility > 10 km.';
  }

  // Weight penalty
  if (weightKg > 1000) {
    baseScore = Math.min(baseScore + 10, 95);
    factors.push(`Heavy freight payload (${weightKg} kg) increases momentum on steep downhill grades.`);
  }

  // Cargo specific advisory
  if (cargoType === 'MEDICINE') {
    advisory += ' Temperature-sensitive cargo: ensure vehicle refrigeration unit is monitored at every checkpoint.';
  } else if (cargoType === 'DISASTER_AID') {
    advisory += ' Heavy emergency rescue gear: maintain wide turning radius on hairpin bends.';
  }

  let level: RiskLevel = 'SAFE';
  if (baseScore >= 70) {
    level = 'BLOCKED';
  } else if (baseScore >= 35) {
    level = 'CAUTION';
  }

  return {
    risk_score: baseScore,
    risk_level: level,
    risk_summary: summary,
    risk_factors: factors,
    weather_condition: weather,
    recommended_route: recRoute,
    safety_advisory: advisory,
    engine: 'ResQRoute Highland Terrain Engine (Offline & Live Resilient)'
  };
}
