import { useContext, useState, useRef, useMemo } from "react";
import { Button, Input, Label, Box, Grid, Column, Text } from "@twilio-paste/core";
import { SendIcon } from '@twilio-paste/icons/esm/SendIcon';
import { AttachIcon } from '@twilio-paste/icons/esm/AttachIcon';
import { CloseIcon } from '@twilio-paste/icons/esm/CloseIcon';
import { useSelector } from "react-redux";
import { TwilioConversationsContext } from '../WebsocketManagers/ConversationsManager';
import MessageList from "./MessageList"

function SendSmsForm({ numberInUse }) {
  const [messageBody, setMessageBody] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const fileInputRef = useRef(null);

  const channelData = useSelector(state => state.channelData)
  const destinationNumber = useSelector(state => state.destinationNumber)

  const conversationsClient = useContext(TwilioConversationsContext)
  const {sendMessage, sendSms} = conversationsClient

  const canSendMessages = useMemo(() => {
    return destinationNumber && destinationNumber.length > 6;
  }, [destinationNumber]);

  const sendIt = async (e) => {
    e.preventDefault()
    if (canSendMessages) {
      sendSms(numberInUse, destinationNumber, messageBody, mediaFile);
      await sendMessage(messageBody, mediaFile)
      setMessageBody('')
      setMediaFile(null)
    } else {
      setShowWarning(true)
    }
  };

  return (
    <Box width="100%" backgroundColor={"colorBackgroundBody"}>
      <MessageList
        devPhoneName={channelData.devPhoneName}
      />
      <form onSubmit={(e) => sendIt(e)} method={"GET"}>
        <Label htmlFor="sendSmsBody" required>Message</Label>
        {mediaFile && (
          <Box display="flex" alignItems="center" marginBottom="space20">
            <Text as="span" fontSize="fontSize20" color="colorTextWeak">
              {mediaFile.name}
            </Text>
            <Button variant="reset" size="reset" onClick={() => setMediaFile(null)}>
              <CloseIcon decorative={false} title="Remove attachment" size="sizeIcon10" />
            </Button>
          </Box>
        )}
        <Grid gutter={"space20"} marginBottom="space40">
          <Column span={9}>
            <Input id="sendSmsBody" type="text" value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
          </Column>
          <Column span={1}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*"
              onChange={(e) => setMediaFile(e.target.files[0] || null)}
            />
            <Button variant="secondary" onClick={() => fileInputRef.current.click()} type="button">
              <AttachIcon decorative={false} title="Attach media" />
            </Button>
          </Column>
          <Column span={2}>
            <Button type={"submit"} disabled={!canSendMessages}>
              <SendIcon decorative />
              Send
            </Button>
          </Column>
        </Grid>
      </form>
    </Box>

  );
}





export default SendSmsForm;
