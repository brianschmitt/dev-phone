import { useState, useEffect, useRef } from "react"
import {
    Box, SkeletonLoader,
    ChatLog, ChatMessage,
    ChatBubble, ChatMessageMeta, ChatMessageMetaItem,
    Avatar
} from "@twilio-paste/core"
import { UserIcon } from '@twilio-paste/icons/esm/UserIcon';
import { useSelector } from "react-redux"
import EmptyMessageList from "./EmptyMessageList";

function MediaAttachments({ media }) {
    const [urls, setUrls] = useState([]);

    useEffect(() => {
        if (!media || media.length === 0) return;
        Promise.all(media.map(m => m.getContentTemporaryUrl()))
            .then(setUrls)
            .catch(console.error);
    }, [media]);

    if (urls.length === 0) return null;

    return urls.map((url, index) => (
        <img
            key={index}
            src={url}
            alt="MMS content"
            style={{ maxWidth: '100%', borderRadius: '4px', marginTop: '8px' }}
        />
    ));
}

function MessageList({ devPhoneName }) {
    const messageList = useSelector(state => state.messageList)
    const numberInUse = useSelector(state => state.numberInUse ? state.numberInUse.phoneNumber : "");
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList]);

    return (
        messageList ?
            <Box overflowY="scroll" height="size40" tabIndex={0}>
                <ChatLog>
                    {messageList.length > 0 ?
                        messageList.map((message, i) => {
                            const isFromDevPhone = message.author === devPhoneName;
                            return (
                                <ChatMessage variant={!isFromDevPhone ? "outbound" : "inbound"}>
                                    <ChatBubble>
                                        <span style={{ whiteSpace: 'pre-wrap' }}>{message.body}</span>
                                        <MediaAttachments media={message.attachedMedia} />
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
                    <div ref={scrollRef} />
                </ChatLog>
            </Box>
            : <SkeletonLoader height={"size20"} />
    )
}

export default MessageList