import {FormEvent, useState} from 'react';
import {useNavigate} from 'react-router';
import {Button, Form, Header, Icon, Message, Segment} from 'semantic-ui-react';
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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (!password || loading) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      setStatus('Downloading encrypted archive...');
      const encryptedArchive = await fetchEncryptedArchive(props.archiveUrl);

      setStatus('Decrypting archive...');
      const decryptedArchive = await decryptEncryptedArchive(
        encryptedArchive,
        password,
      );

      setStatus('Preparing family tree...');
      const {gedcom, images} = await loadFile(new Blob([decryptedArchive]));
      const hash = `encrypted-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      storeGedcom(hash, gedcom, images);
      navigate({pathname: '/view', search: `?file=${encodeURIComponent(hash)}`});
    } catch (e) {
      setError((e as Error).message || String(e));
    } finally {
      setLoading(false);
      setStatus('');
    }
  }

  return (
    <div id="unlockContent">
      <Segment id="unlockPanel">
        <Header as="h2">
          <Icon name="lock" />
          <Header.Content>Family Tree</Header.Content>
        </Header>
        <Form onSubmit={unlock} error={!!error}>
          <Form.Input
            autoFocus
            disabled={loading}
            label="Password"
            type="password"
            value={password}
            onChange={(_, data) => setPassword(String(data.value || ''))}
          />
          <Message error header="Unable to unlock archive" content={error} />
          {status && <Message info content={status} />}
          <Button
            primary
            fluid
            type="submit"
            loading={loading}
            disabled={!password || loading}
          >
            Unlock
          </Button>
        </Form>
      </Segment>
    </div>
  );
}
