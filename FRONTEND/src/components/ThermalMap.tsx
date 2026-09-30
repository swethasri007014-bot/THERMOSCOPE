import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

interface BackendThermalEvent {
  event_id: string;
  lat: number;
  lon: number;
  detection_count?: number;
  active_days?: number;
  persistence_ratio?: number;
  night_ratio?: number;
  confidence_score?: number;
  max_frp?: number;
  mean_frp?: number;
  industrial_score?: number;
  natural_score?: number;
  abnormal_score?: number;
  evidence_conflict?: boolean;
  primary_hypothesis?: string;
  final_investigation_result?: string;
  requires_human_verification?: boolean;
  ml_anomaly_score?: number;
  ml_anomaly_class?: string;
  ml_investigation_flag?: boolean;
  priority?: number;
}

interface ThermalMapProps {
  events: BackendThermalEvent[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  showLegend?: boolean;
}

type MapClassification =
  | 'Industrial'
  | 'AI Anomaly'
  | 'Unknown'
  | 'Ambiguous'
  | 'Conflict';

function getClassification(
  event: BackendThermalEvent
): MapClassification {
  const result = (
    event.final_investigation_result ?? ''
  ).toLowerCase();

  if (
    event.evidence_conflict === true ||
    result.includes('conflicting')
  ) {
    return 'Conflict';
  }

  if (
    event.ml_investigation_flag === true ||
    result.includes('ai anomaly')
  ) {
    return 'AI Anomaly';
  }

  if (result.includes('ambiguous')) {
    return 'Ambiguous';
  }

  if (result.includes('industrial')) {
    return 'Industrial';
  }

  return 'Unknown';
}

function classificationColor(
  classification: MapClassification
): string {
  switch (classification) {
    case 'Industrial':
      return '#147D7E';
    case 'AI Anomaly':
      return '#D99A2B';
    case 'Unknown':
      return '#9CA3AF';
    case 'Ambiguous':
      return '#E4C04D';
    case 'Conflict':
      return '#C85C5C';
    default:
      return '#9CA3AF';
  }
}

function createCircleMarker(
  color: string,
  radius: number
): L.DivIcon {
  return L.divIcon({
    className: 'thermoscope-marker',
    html: `
      <div style="
        width:${radius * 2}px;
        height:${radius * 2}px;
        border-radius:50%;
        background:${color};
        border:2px solid #fff;
        box-shadow:
          0 0 6px ${color}80,
          0 1px 3px rgba(0,0,0,0.4);
      "></div>
    `,
    iconSize: [radius * 2, radius * 2],
    iconAnchor: [radius, radius],
  });
}

function popupContent(
  event: BackendThermalEvent
): string {
  const classification = getClassification(event);
  const color = classificationColor(classification);

  const verificationRequired =
    event.requires_human_verification === true;

  const verificationText = verificationRequired
    ? 'Required'
    : 'Not Required';

  const verificationColor = verificationRequired
    ? '#D99A2B'
    : '#147D7E';

  const lat = Number(event.lat).toFixed(4);
  const lon = Number(event.lon).toFixed(4);

  const maxFRP =
    event.max_frp !== undefined
      ? Number(event.max_frp).toFixed(1)
      : '—';

  const priority =
    event.priority !== undefined
      ? event.priority
      : '—';

  return `
    <div style="
      font-family:system-ui,sans-serif;
      min-width:220px;
    ">

      <div style="
        border-left:4px solid ${color};
        padding-left:10px;
        margin-bottom:10px;
      ">
        <div style="
          font-size:10px;
          color:#9CA3AF;
          text-transform:uppercase;
          letter-spacing:0.05em;
        ">
          Event ID
        </div>

        <div style="
          font-size:14px;
          font-weight:600;
          color:#203040;
          font-family:monospace;
        ">
          ${event.event_id}
        </div>
      </div>

      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        margin-bottom:8px;
      ">
        <span style="
          width:10px;
          height:10px;
          border-radius:50%;
          background:${color};
          display:inline-block;
        "></span>

        <span style="
          font-size:12px;
          color:#203040;
          font-weight:500;
        ">
          ${classification}
        </span>
      </div>

      <div style="
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:6px 12px;
        font-size:11px;
        margin-bottom:10px;
      ">

        <div>
          <span style="color:#9CA3AF;">
            Lat/Lng
          </span>
          <br/>

          <span style="
            color:#203040;
            font-family:monospace;
          ">
            ${lat}, ${lon}
          </span>
        </div>

        <div>
          <span style="color:#9CA3AF;">
            Priority
          </span>
          <br/>

          <span style="
            color:#203040;
            font-weight:700;
            font-size:14px;
          ">
            ${priority}
          </span>
        </div>

        <div>
          <span style="color:#9CA3AF;">
            Verification
          </span>
          <br/>

          <span style="
            color:${verificationColor};
            font-weight:600;
          ">
            ${verificationText}
          </span>
        </div>

        <div>
          <span style="color:#9CA3AF;">
            Max FRP
          </span>
          <br/>

          <span style="
            color:#203040;
            font-weight:600;
          ">
            ${maxFRP} MW
          </span>
        </div>

      </div>

      <a
        href="#/investigate/${event.event_id}"
        data-event-id="${event.event_id}"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          background:#147D7E;
          color:#fff;
          text-decoration:none;
          border-radius:8px;
          padding:8px 12px;
          font-size:12px;
          font-weight:500;
        "
      >
        Investigate Event &#8594;
      </a>

    </div>
  `;
}

const legendItems = [
  { label: 'Industrial', color: '#147D7E' },
  { label: 'AI Anomaly', color: '#D99A2B' },
  { label: 'Unknown', color: '#9CA3AF' },
  { label: 'Ambiguous', color: '#E4C04D' },
  { label: 'Conflict', color: '#C85C5C' },
];

export default function ThermalMap({
  events,
  selectedId,
  onSelect,
  className = '',
  showLegend = true,
}: ThermalMapProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<L.Map | null>(null);

  const markersRef =
    useRef<L.Marker[]>([]);

  const navigate = useNavigate();

  /*
   * Initialize Leaflet map.
   */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
      zoomControl: false,
      worldCopyJump: true,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors',
      }
    ).addTo(map);

    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    L.control
      .attribution({
        position: 'bottomright',
        prefix: false,
      })
      .addAttribution(
        '&copy; OpenStreetMap contributors'
      )
      .addTo(map);

    mapRef.current = map;

    /*
     * Important:
     * Force Leaflet to calculate the container size
     * after the map becomes visible.
     */
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /*
   * Render backend events as markers.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    const validEvents = events.filter(
      (event) =>
        Number.isFinite(event.lat) &&
        Number.isFinite(event.lon) &&
        event.lat >= -90 &&
        event.lat <= 90 &&
        event.lon >= -180 &&
        event.lon <= 180
    );
    console.log('MARKER EFFECT:', {
  events: events.length,
  validEvents: validEvents.length,
  firstEvent: events[0],
  firstValidEvent: validEvents[0],
});

    validEvents.forEach((event) => {
      const classification =
        getClassification(event);

      const color =
        classificationColor(classification);

      const intensity = Math.min(
        Math.max(
          Number(event.max_frp ?? 0),
          0
        ),
        100
      );

      const radius =
        7 + (intensity / 100) * 5;

      const marker = L.marker(
        [event.lat, event.lon],
        {
          icon: createCircleMarker(
            color,
            radius
          ),
          zIndexOffset:
            Number(event.priority ?? 0),
        }
      );

      marker.bindPopup(
        popupContent(event),
        {
          maxWidth: 280,
          closeButton: true,
          autoClose: true,
        }
      );

      marker.on('click', () => {
        onSelect?.(event.event_id);
      });

     marker.addTo(map);

console.log('MARKER CREATED:', event.event_id);

markersRef.current.push(marker);
    });

    /*
     * Fit the map to all backend events.
     */
    if (validEvents.length > 0) {
      const bounds = L.latLngBounds(
        validEvents.map(
          (event) =>
            [event.lat, event.lon] as [
              number,
              number
            ]
        )
      );

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 6,
      });
    }

    /*
     * Make sure Leaflet redraws after markers
     * have been added.
     */
    map.invalidateSize();
  }, [events, onSelect]);

  /*
   * Popup → Investigation page.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const handlePopupClick = (e: Event) => {
      const target =
        e.target as HTMLElement;

      const link =
        target.closest(
          '[data-event-id]'
        ) as HTMLElement | null;

      if (!link) {
        return;
      }

      e.preventDefault();

      const eventId =
        link.getAttribute(
          'data-event-id'
        );

      if (eventId) {
        map.closePopup();
        navigate(
          `/investigate/${eventId}`
        );
      }
    };

    const container =
      map.getContainer();

    container.addEventListener(
      'click',
      handlePopupClick,
      true
    );

    return () => {
      container.removeEventListener(
        'click',
        handlePopupClick,
        true
      );
    };
  }, [navigate]);

  /*
   * Fly to selected event.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedId) {
      return;
    }

    const event = events.find(
      (item) =>
        item.event_id === selectedId
    );

    if (!event) {
      return;
    }

    map.flyTo(
      [event.lat, event.lon],
      Math.max(
        map.getZoom(),
        10
      ),
      {
        duration: 0.8,
      }
    );

    const marker =
      markersRef.current.find(
        (item) => {
          const location =
            item.getLatLng();

          return (
            Math.abs(
              location.lat -
                event.lat
            ) < 0.001 &&
            Math.abs(
              location.lng -
                event.lon
            ) < 0.001
          );
        }
      );

    if (marker) {
      marker.openPopup();
    }
  }, [selectedId, events]);

  /*
   * Keep Leaflet responsive.
   */
  
  useEffect(() => {
  const map = mapRef.current;

  console.log('THERMOSCOPE MAP DEBUG:', {
    eventsCount: events.length,
    firstEvent: events[0],
    mapExists: !!map,
  });

  if (!map) return;

    const resizeObserver =
      new ResizeObserver(() => {
        map.invalidateSize();
      });

    resizeObserver.observe(
      containerRef.current
    );

    return () =>
      resizeObserver.disconnect();
  }, []);

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
      />

      {showLegend && (
        <div
          className="
            absolute bottom-3 left-3
            bg-[#0F2537]/95
            backdrop-blur-sm
            rounded-lg
            px-3 py-2.5
            border border-white/10
            z-[1000]
            pointer-events-none
          "
        >
          <p
            className="
              text-[9px]
              text-white/40
              uppercase
              tracking-wider
              mb-1.5
            "
          >
            Classification
          </p>

          <div className="space-y-1">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="
                  flex items-center gap-2
                "
              >
                <span
                  className="
                    rounded-full
                    border border-white/40
                    shrink-0
                  "
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor:
                      item.color,
                  }}
                />

                <span
                  className="
                    text-[10px]
                    text-white/70
                    leading-tight
                  "
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="
          absolute top-3 left-3
          flex flex-col gap-1.5
          z-[1000]
        "
      >
        <button
          onClick={() => {
            const map =
              mapRef.current;

            if (
              !map ||
              events.length === 0
            ) {
              return;
            }

            const validEvents =
              events.filter(
                (event) =>
                  Number.isFinite(
                    event.lat
                  ) &&
                  Number.isFinite(
                    event.lon
                  )
              );

            if (
              validEvents.length === 0
            ) {
              return;
            }

            const bounds =
              L.latLngBounds(
                validEvents.map(
                  (event) =>
                    [
                      event.lat,
                      event.lon,
                    ] as [
                      number,
                      number
                    ]
                )
              );

            map.fitBounds(
              bounds,
              {
                padding: [40, 40],
                maxZoom: 6,
              }
            );
          }}
          className="
            flex items-center gap-1.5
            text-[10px] text-white/70
            bg-[#0F2537]/90
            backdrop-blur-sm
            rounded-lg
            px-2.5 py-1.5
            border border-white/10
            hover:bg-[#147D7E]
            hover:text-white
            transition-all
          "
        >
          Fit All
        </button>

        <button
          onClick={() => {
            const map =
              mapRef.current;

            if (!map) {
              return;
            }

            map.setView(
              [20, 0],
              2
            );
          }}
          className="
            flex items-center gap-1.5
            text-[10px] text-white/70
            bg-[#0F2537]/90
            backdrop-blur-sm
            rounded-lg
            px-2.5 py-1.5
            border border-white/10
            hover:bg-[#147D7E]
            hover:text-white
            transition-all
          "
        >
          Reset View
        </button>
      </div>
    </div>
  );
} 