import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {useIntl} from 'react-intl';
import {Button, Icon, Sidebar, Tab} from 'semantic-ui-react';
import {TopolaData} from '../util/gedcom_util';
import {Config, ConfigPanel} from './config/config';
import {CollapsedDetails} from './details/collapsed-details';
import {Details} from './details/details';

interface SidePanelProps {
  data: TopolaData;
  selectedIndiId: string;
  config: Config;
  onConfigChange: (config: Config) => void;
  expanded: boolean;
  onToggle: () => void;
}

const DEFAULT_DESKTOP_WIDTH = 350;
const MIN_DESKTOP_WIDTH = 320;
const MIN_REMAINING_WIDTH = 320;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SidePanel({
  data,
  selectedIndiId,
  config,
  onConfigChange,
  expanded,
  onToggle,
}: SidePanelProps) {
  const intl = useIntl();
  const [desktopWidth, setDesktopWidth] = useState(DEFAULT_DESKTOP_WIDTH);
  const dragState = useRef<{startX: number; startWidth: number} | null>(null);

  useEffect(() => {
    function stopDragging() {
      dragState.current = null;
      document.body.classList.remove('is-resizing-sidebar');
    }

    function onPointerMove(event: PointerEvent) {
      const drag = dragState.current;
      if (!drag) {
        return;
      }

      const maxWidth = Math.max(
        MIN_DESKTOP_WIDTH,
        window.innerWidth - MIN_REMAINING_WIDTH,
      );
      const nextWidth = clamp(
        drag.startWidth + (drag.startX - event.clientX),
        MIN_DESKTOP_WIDTH,
        maxWidth,
      );
      setDesktopWidth(nextWidth);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      document.body.classList.remove('is-resizing-sidebar');
    };
  }, []);

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!expanded || event.button !== 0) {
      return;
    }

    event.preventDefault();
    dragState.current = {
      startX: event.clientX,
      startWidth: desktopWidth,
    };
    document.body.classList.add('is-resizing-sidebar');
  }

  const tabs = [
    {
      menuItem: intl.formatMessage({
        id: 'tab.info',
        defaultMessage: 'Info',
      }),
      render: () => (
        <Details
          gedcom={data.gedcom}
          indi={selectedIndiId}
          config={config}
          images={data.images}
          mediaBaseUrl={data.mediaBaseUrl}
        />
      ),
    },
    {
      menuItem: intl.formatMessage({
        id: 'tab.settings',
        defaultMessage: 'Settings',
      }),
      render: () => (
        <ConfigPanel
          gedcom={data.gedcom}
          config={config}
          onChange={onConfigChange}
        />
      ),
    },
  ];

  const sidebarStyle = {
    width: expanded ? `${desktopWidth}px` : '60px',
    '--sidebar-width': `${desktopWidth}px`,
  } as CSSProperties & {'--sidebar-width': string};

  return (
    <Sidebar
      id="sidebar"
      style={sidebarStyle}
      animation="overlay"
      icon="labeled"
      width={expanded ? 'wide' : 'very thin'}
      direction="right"
      visible={true}
    >
      {expanded ? (
        <div
          aria-hidden="true"
          className="sidebar-resize-handle"
          onPointerDown={startResize}
        />
      ) : null}
      {expanded ? (
        <Tab id="sideTabs" panes={tabs} />
      ) : (
        <CollapsedDetails gedcom={data.gedcom} indi={selectedIndiId} />
      )}
      <Button id="sideToggle" icon size="mini" onClick={() => onToggle()}>
        <Icon size="large" name={expanded ? 'arrow right' : 'arrow left'} />
      </Button>
    </Sidebar>
  );
}
