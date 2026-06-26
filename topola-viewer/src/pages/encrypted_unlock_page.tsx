import {FormEvent, useState} from 'react';
import {useNavigate} from 'react-router';
import {Button, Form, Icon, Message, Segment} from 'semantic-ui-react';
import {loadFile} from '../datasource/load_data';
import {storeGedcom} from '../datasource/gedcom_store';
import {decryptEncryptedArchive} from '../util/encrypted_archive';

interface Props {
  archiveUrl: string;
}

async function fetchEncryptedArchive(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(`Failed to download encrypted archive (${response.status}).`);
  }
  return response.arrayBuffer();
}

export function EncryptedUnlockPage(props: Props) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!password || loading) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const encryptedArchive = await fetchEncryptedArchive(props.archiveUrl);

      const decryptedArchive = await decryptEncryptedArchive(
        encryptedArchive,
        password,
      );

      const {gedcom, images} = await loadFile(new Blob([decryptedArchive]));
      const hash = `encrypted-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      storeGedcom(hash, gedcom, images);

      setPassword('');
      setShowPassword(false);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      navigate(
        {pathname: '/view', search: `?file=${encodeURIComponent(hash)}`},
        {replace: true},
      );
      return;
    } catch (e) {
      setError((e as Error).message || String(e));
    }

    setLoading(false);
  }

  return (
    <main id="unlockContent" className={loading ? 'isUnlocking' : undefined}>
      <Segment id="unlockPanel">
        <div className="unlockCoatOfArms">
          <img src={`${import.meta.env.BASE_URL}coa.png`} alt="Brunner Wappen" />
        </div>

        <h1>Stammbaum der Familie Brunner</h1>

        <Form onSubmit={unlock} error={!!error}>
          <Form.Field className="unlockPasswordField">
            <label htmlFor="tree-unlock-passphrase">Passwort</label>
            <div className="unlockPasswordRow">
              <input
                id="tree-unlock-passphrase"
                name="tree-unlock-passphrase"
                autoComplete="off"
                autoFocus
                data-1p-ignore="true"
                data-bwignore="true"
                data-lpignore="true"
                disabled={loading}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                aria-pressed={showPassword}
                className="passwordToggle"
                disabled={loading}
                onClick={() => setShowPassword((shown) => !shown)}
                title={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
                type="button"
              >
                <Icon name={showPassword ? 'eye slash' : 'eye'} />
              </button>
            </div>
          </Form.Field>
          <Message error header="Unable to unlock archive" content={error} />
          <Button
            className="unlockSubmit"
            fluid
            type="submit"
            loading={loading}
            disabled={!password || loading}
          >
            <span>{'\u00d6ffnen'}</span>
            <Icon name="arrow right" />
          </Button>
        </Form>
      </Segment>
    </main>
  );
}