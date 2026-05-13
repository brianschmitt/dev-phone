import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Client } from '@twilio/conversations'
import { addMessage } from '../../actions'

// Establish context with relevant websocket resources for child components
const TwilioConversationsContext = React.createContext(null)
export { TwilioConversationsContext }

const TwilioConversationsManager = ({ children }) => {
    const activeConversation = useRef(null)
    const conversationsClient = useRef(null)
    const conversationDetails = useRef({})
    const channelData = useSelector(state => state.channelData)
    const twilioAccessToken = useSelector(state => state.twilioAccessToken)
    const dispatch = useDispatch()

    const sendSms = (from, to, body, mediaFile) => {
        if (from && to && (body || mediaFile)) {
          const formData = new FormData();
          formData.append('from', from);
          formData.append('to', to);
          if (body) formData.append('body', body);
          if (mediaFile) formData.append('media', mediaFile);
          fetch("/send-sms", {
            method: "POST",
            body: formData,
          });
        } else {
          console.error("Not sending as some data is missing");
        }
    };

    const sendMessage = async (body, mediaFile) => {
        if (!activeConversation.current) return;
        if (mediaFile) {
            const builder = activeConversation.current.prepareMessage();
            if (body) builder.setBody(body);
            builder.addMedia({
                contentType: mediaFile.type,
                filename: mediaFile.name,
                media: mediaFile
            });
            await builder.build().send();
        } else {
            activeConversation.current.sendMessage(body);
        }
    }

    // Creates and sets up the Twilio Conversations Client for this context
    if (!conversationsClient.current) {
        const client = new Client(twilioAccessToken)

        // Populates the redux state with existing messages
        async function populateMessageList(conversation) {
            const messages = await conversation.getMessages()
            messages.items.forEach(message => {
                dispatch(addMessage(message))
            })
        }

        // configures listeners for the active conversation
        function configureConversationListeners(conversation) {
            conversation.on('messageAdded', (message) => {
                console.log('Message added!')
                dispatch(addMessage(message))
            })
        }

        // Retrieve the conversation resource created by the CLI and pass it to UI
        async function getConversationBySid() {
            try {
                const sid = channelData.conversation.sid
                activeConversation.current = await client.getConversationBySid(sid)
                await populateMessageList(activeConversation.current)
                configureConversationListeners(activeConversation.current)
            } catch (error) {
              console.error(error)
            }
        }

        client.on('connectionStateChanged', (connectionState) => {
            if (connectionState === 'connecting') {
              console.log('connecting conversations')
            }
    
            if (connectionState === "connected") {
              console.log('conversations connected')
              getConversationBySid()
            }
            if (connectionState === "disconnecting") {
              console.log('conversations disconnecting')
            }
            if (connectionState === "disconnected") {
              console.log('conversations disconnected')
            }
            if (connectionState === "denied") {
              console.log('conversations denied')
            }
        })
    
        client.on('connectionError', (data) => {
            console.error(data)
        })

        conversationsClient.current = client

        conversationDetails.current = {
            conversationsClient: conversationsClient,
            sendMessage,
            sendSms
        }
    }

    return (
        <TwilioConversationsContext.Provider value={conversationDetails.current}>
            {children}
        </TwilioConversationsContext.Provider>
    )

};

export default TwilioConversationsManager