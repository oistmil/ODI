package com.homegravity.Odi.global.service;

import com.homegravity.Odi.domain.chat.dto.ChatMessageDTO;
import com.homegravity.Odi.domain.chat.entity.ChatMessage;
import com.homegravity.Odi.domain.chat.entity.MessageType;
import com.homegravity.Odi.domain.chat.repository.ChatMessageRepository;
import com.homegravity.Odi.domain.member.entity.Member;
import com.homegravity.Odi.domain.member.repository.MemberRepository;
import com.homegravity.Odi.domain.notification.dto.NotificationDTO;
import com.homegravity.Odi.domain.notification.entity.Notification;
import com.homegravity.Odi.domain.notification.entity.NotificationType;
import com.homegravity.Odi.domain.notification.repository.NotificationRepository;
import com.homegravity.Odi.domain.party.entity.Party;
import com.homegravity.Odi.domain.party.respository.PartyRepository;
import com.homegravity.Odi.global.response.error.ErrorCode;
import com.homegravity.Odi.global.response.error.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class RedisService {

    private final ChatMessageRepository chatMessageRepository;
    private final NotificationRepository notificationRepository;
    private final MemberRepository memberRepository;
    private final PartyRepository partyRepository;

    private final ChannelTopic chatTopic;
    private final ChannelTopic notificationTopic;
    private final RedisTemplate redisTemplate;

    /**
     * 채팅방에 메시지 발송
     */
    public void sendChatMessage(ChatMessageDTO chatMessage) {

        Member target = memberRepository.findByIdAndDeletedAtIsNull(chatMessage.getTargetId())
                .orElseThrow(()->new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST,ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));
        String targetNickname = target.getNickname();

        switch (chatMessage.getType()) {
            case MessageType.DATE:
                chatMessage.setContent(chatMessage.getSendTime()); break;
            case MessageType.ENTER:
                chatMessage.setContent(targetNickname + "님이 입장하셨습니다."); break;
            case MessageType.QUIT:
                chatMessage.setContent(chatMessage.getSenderNickname() + "님이 퇴장하셨습니다."); break;
            case MessageType.KICK:
                chatMessage.setContent(targetNickname + "님이 강퇴되었습니다."); break;
            case MessageType.CONFIRM:
                chatMessage.setContent("파티가 성사되었습니다! 🎉"); break;
            case MessageType.SETTLEMENT_REQUEST:
                chatMessage.setContent(chatMessage.getSenderNickname() + "님이 정산을 요청하셨습니다."); break;
            case MessageType.SETTLEMENT_SUCCESS:
                chatMessage.setContent(chatMessage.getSenderNickname() + "님이 정산을 완료하셨습니다."); break;
        }
        
        redisTemplate.convertAndSend(chatTopic.getTopic(), chatMessage);
        // 메세지 닉네임 기반으로 유저 조회
        Member sender = memberRepository.findByNicknameAndDeletedAtIsNull(chatMessage.getSenderNickname())
                .orElseThrow(()->new BusinessException(ErrorCode.MEMBER_NICKNAME_NOT_EXIST,ErrorCode.MEMBER_NICKNAME_NOT_EXIST.getMessage()));
        Party party = partyRepository.findByRoomIdAndDeletedAtIsNull(chatMessage.getRoomId())
                .orElseThrow(()->new BusinessException(ErrorCode.NOT_FOUND_ERROR, ErrorCode.NOT_FOUND_ERROR.getMessage()));
        // 메세지 DB 저장
        chatMessageRepository.save(ChatMessage.builder()
                        .content(chatMessage.getContent())
                        .sender(sender)
                        .party(party)
                        .messageType(chatMessage.getType())
                .build());
    }

    /**
     * 개인 알림방에 메시지 발송
     */
    public void sendNotification(NotificationDTO notification) {
        // 메세지 ID 기반으로 유저 조회
        Member receiver = memberRepository.findByIdAndDeletedAtIsNull(notification.getReceiverId())
                .orElseThrow(()->new BusinessException(ErrorCode.MEMBER_ID_NOT_EXIST,ErrorCode.MEMBER_ID_NOT_EXIST.getMessage()));
        Party party = partyRepository.findById(notification.getPartyId())
                .orElseThrow(()->new BusinessException(ErrorCode.NOT_FOUND_ERROR, ErrorCode.NOT_FOUND_ERROR.getMessage()));

        switch (notification.getType()) {
            case NotificationType.APPLY:
                notification.setContent(party.getTitle() + " 파티에 동승 신청이 들어왔어요! 👀"); break;
            case NotificationType.ACCEPT:
                notification.setContent(party.getTitle() + " 파티에 승인되었어요!"); break;
            case NotificationType.REJECT:
                notification.setContent(party.getTitle() + " 파티에서 거절되었습니다."); break;
            case NotificationType.KICK:
                notification.setContent(party.getTitle() + " 파티에서 강퇴되었습니다."); break;
            case NotificationType.QUIT:
                notification.setContent(party.getTitle() + " 파티의 " + notification.getSenderNickname() + " 님이 퇴장하셨습니다."); break;
            case NotificationType.CONFIRM:
                notification.setContent(party.getTitle() + " 파티가 성사되었습니다! 🎉"); break;
            case NotificationType.SETTLEMENT_REQUEST:
                notification.setContent(party.getTitle()+" 파티의 " + notification.getSenderNickname() + " 님이 정산을 요청하셨습니다."); break;
            case NotificationType.SETTLEMENT_SUCCESS:
                notification.setContent(party.getTitle()+" 파티의 " + notification.getSenderNickname() + " 님이 정산을 완료하셨습니다."); break;
        }
        redisTemplate.convertAndSend(notificationTopic.getTopic(), notification);

        // 알림 DB 저장
        notificationRepository.save(Notification.builder()
                .content(notification.getContent())
                .receiver(receiver)
                .party(party)
                .notificationType(notification.getType())
                .build());
    }
}
