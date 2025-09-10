import {
    Box, SkeletonLoader,
    ChatLog, ChatMessage,
    ChatBubble, ChatMessageMeta, ChatMessageMetaItem,
    Avatar
} from "@twilio-paste/core"
import { UserIcon } from '@twilio-paste/icons/esm/UserIcon';
import { useSelector } from "react-redux"
import EmptyMessageList from "./EmptyMessageList";


function MessageList({ devPhoneName }) {
    const messageList = useSelector(state => state.messageList)
    const numberInUse = useSelector(state => state.numberInUse ? state.numberInUse.phoneNumber : "");

    return (
        messageList ?
            <Box overflowY="scroll" height="size40" tabIndex={0}>
                <ChatLog>
                    {messageList.length > 0 ?
                        messageList.map((message, i) => {
                            const isFromDevPhone = message.author === devPhoneName;
                            const mediaItems = message.attributes?.media;
                            return (
                                <ChatMessage variant={!isFromDevPhone ? "outbound" : "inbound"}>
                                    <ChatBubble>
                                        {message.body}
                                        {mediaItems.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt="MMS content"
                                                style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '8px' }}
                                            />
                                        ))}
                                    </ChatBubble>
                                    <ChatMessageMeta aria-label={!isFromDevPhone ? "said by outbound user" : "said by dev phone"}>
                                        <ChatMessageMetaItem>
                                            <Avatar size="sizeIcon30" name={message.author} icon={UserIcon} />
                                            {message.author}
                                        </ChatMessageMetaItem>
                                    </ChatMessageMeta>
                                </ChatMessage>
                            )
                        })
                        : <EmptyMessageList devPhoneNumber={numberInUse} />
                    }
                </ChatLog>
            </Box>
            : <SkeletonLoader height={"size20"} />
    )
}

export default MessageList