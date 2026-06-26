import queryString from 'query-string';
import {FormattedMessage} from 'react-intl';
import {useLocation, useNavigate} from 'react-router';
import {Dropdown, Icon, Menu} from 'semantic-ui-react';
import {IndiInfo, JsonGedcomData} from 'topola';
import {isGoogleDriveConfigured} from '../datasource/google_drive_service';
import {Media} from '../util/media';
import {GoogleDriveMenu} from './google_drive_menu';
import {MenuItem, MenuType} from './menu_item';
import {SearchBar} from './search';
import {UrlMenu} from './url_menu';
import {WikiTreeLoginMenu, WikiTreeMenu} from './wikitree_menu';

enum ScreenSize {
  LARGE,
  SMALL,
}

interface EventHandlers {
  onSelection: (indiInfo: IndiInfo) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onDownloadPng: () => void;
  onDownloadSvg: () => void;
}

interface Props {
  /** True if the application is currently showing a chart. */
  showingChart: boolean;
  /** Data used for the search index. */
  data?: JsonGedcomData;
  standalone: boolean;
  /** Whether to show the "All relatives" chart type in the menu. */
  allowAllRelativesChart?: boolean;
  allowPrintAndDownload?: boolean;
  eventHandlers?: EventHandlers;
  /** Whether to show additional WikiTree menus. */
  showWikiTreeMenus?: boolean;
  /** Whether the user has authorized Google Drive and has an active token. */
  hasGoogleToken?: boolean;
  /** Callback to sign out of Google Drive. */
  onGoogleSignOut?: () => void;
  /** Callback triggered when a new Google Drive token is acquired. */
  onGoogleTokenAcquired?: () => void;
}

export function TopBar(props: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  function changeView(view: string) {
    const search = queryString.parse(location.search);
    if (search.view !== view) {
      search.view = view;
      location.search = queryString.stringify(search);
      navigate(location);
    }
  }

  function chartMenus(screenSize: ScreenSize) {
    if (!props.showingChart || !props.data) {
      return null;
    }
    const chartTypeItems = (
      <>
        <Dropdown.Item onClick={() => changeView('hourglass')}>
          <Icon name="hourglass" />
          <FormattedMessage
            id="menu.hourglass"
            defaultMessage="Hourglass chart"
          />
        </Dropdown.Item>
        {props.allowAllRelativesChart ? (
          <Dropdown.Item onClick={() => changeView('relatives')}>
            <Icon name="users" />
            <FormattedMessage
              id="menu.relatives"
              defaultMessage="All relatives"
            />
          </Dropdown.Item>
        ) : null}
        <Dropdown.Item onClick={() => changeView('donatso')}>
          <Icon name="users" />
          <FormattedMessage
            id="menu.donatso"
            defaultMessage="Donatso family chart"
          />
        </Dropdown.Item>
        <Dropdown.Item onClick={() => changeView('fancy')}>
          <Icon name="users" />
          <FormattedMessage
            id="menu.fancy"
            defaultMessage="Fancy tree (experimental)"
          />
        </Dropdown.Item>
      </>
    );
    switch (screenSize) {
      case ScreenSize.LARGE:
        return (
          <>
            <Menu.Item
              onClick={props.eventHandlers?.onPrint}
              disabled={!props.allowPrintAndDownload}
            >
              <Icon name="print" />
              <FormattedMessage id="menu.print" defaultMessage="Print" />
            </Menu.Item>

            <Dropdown
              trigger={
                <div>
                  <Icon name="download" />
                  <FormattedMessage
                    id="menu.download"
                    defaultMessage="Download"
                  />
                </div>
              }
              className="item"
              disabled={!props.allowPrintAndDownload}
            >
              <Dropdown.Menu>
                <Dropdown.Item onClick={props.eventHandlers?.onDownloadPdf}>
                  <FormattedMessage
                    id="menu.pdf_file"
                    defaultMessage="PDF file"
                  />
                </Dropdown.Item>
                <Dropdown.Item onClick={props.eventHandlers?.onDownloadPng}>
                  <FormattedMessage
                    id="menu.png_file"
                    defaultMessage="PNG file"
                  />
                </Dropdown.Item>
                <Dropdown.Item onClick={props.eventHandlers?.onDownloadSvg}>
                  <FormattedMessage
                    id="menu.svg_file"
                    defaultMessage="SVG file"
                  />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            <Dropdown
              trigger={
                <div>
                  <Icon name="eye" />
                  <FormattedMessage id="menu.view" defaultMessage="View" />
                </div>
              }
              className="item"
            >
              <Dropdown.Menu>{chartTypeItems}</Dropdown.Menu>
            </Dropdown>
            <SearchBar
              data={props.data}
              onSelection={
                props.eventHandlers?.onSelection || (() => undefined)
              }
              {...props}
            />
          </>
        );

      case ScreenSize.SMALL:
        return (
          <>
            <Dropdown.Item onClick={props.eventHandlers?.onPrint}>
              <Icon name="print" />
              <FormattedMessage id="menu.print" defaultMessage="Print" />
            </Dropdown.Item>

            <Dropdown.Divider />

            <Dropdown.Item onClick={props.eventHandlers?.onDownloadPdf}>
              <Icon name="download" />
              <FormattedMessage
                id="menu.download_pdf"
                defaultMessage="Download PDF"
              />
            </Dropdown.Item>
            <Dropdown.Item onClick={props.eventHandlers?.onDownloadPng}>
              <Icon name="download" />
              <FormattedMessage
                id="menu.download_png"
                defaultMessage="Download PNG"
              />
            </Dropdown.Item>
            <Dropdown.Item onClick={props.eventHandlers?.onDownloadSvg}>
              <Icon name="download" />
              <FormattedMessage
                id="menu.download_svg"
                defaultMessage="Download SVG"
              />
            </Dropdown.Item>

            <Dropdown.Divider />
            {chartTypeItems}
            <Dropdown.Divider />
          </>
        );
    }
  }

  function googleDriveDisconnectMenu(screenSize: ScreenSize) {
    if (!props.hasGoogleToken || !isGoogleDriveConfigured()) {
      return null;
    }
    return (
      <>
        <MenuItem
          menuType={
            screenSize === ScreenSize.SMALL ? MenuType.Dropdown : MenuType.Menu
          }
          onClick={props.onGoogleSignOut}
        >
          <Icon name="sign out" />
          <FormattedMessage
            id="menu.google_sign_out"
            defaultMessage="Disconnect Google Drive"
          />
        </MenuItem>
        {screenSize === ScreenSize.SMALL ? <Dropdown.Divider /> : null}
      </>
    );
  }

  function wikiTreeLoginMenu(screenSize: ScreenSize) {
    if (!props.showWikiTreeMenus) {
      return null;
    }
    return (
      <>
        <WikiTreeLoginMenu
          menuType={
            screenSize === ScreenSize.SMALL ? MenuType.Dropdown : MenuType.Menu
          }
          {...props}
        />
        {screenSize === ScreenSize.SMALL ? <Dropdown.Divider /> : null}
      </>
    );
  }

  function mobileMenus() {
    return (
      <>
        <Dropdown
          trigger={
            <div>
              <Icon name="sidebar" />
            </div>
          }
          className="item"
          icon={null}
        >
          <Dropdown.Menu>
            {chartMenus(ScreenSize.SMALL)}
            {googleDriveDisconnectMenu(ScreenSize.SMALL)}
            {wikiTreeLoginMenu(ScreenSize.SMALL)}
          </Dropdown.Menu>
        </Dropdown>
        {props.showingChart && props.data && (
          <SearchBar
            data={props.data}
            onSelection={props.eventHandlers?.onSelection || (() => undefined)}
            {...props}
          />
        )}
      </>
    );
  }

  function desktopMenus() {
    return (
      <>
        {chartMenus(ScreenSize.LARGE)}
        <Menu.Menu position="right">
          {googleDriveDisconnectMenu(ScreenSize.LARGE)}
          {wikiTreeLoginMenu(ScreenSize.LARGE)}
        </Menu.Menu>
      </>
    );
  }

  return (
    <>
      <Menu
        as={Media}
        greaterThanOrEqual="large"
        attached="top"
        size="large"
      >
        {desktopMenus()}
      </Menu>
      <Menu
        as={Media}
        at="small"
        attached="top"
        size="large"
      >
        {mobileMenus()}
      </Menu>
    </>
  );
}
