package com.homegravity.Odi.domain.party.entity;

import com.homegravity.Odi.global.entity.BaseTime;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE party_settlement SET deleted_at = NOW() where party_id = ?")
public class PartySettlement extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "party_settlement_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "party_id", nullable = false)
    private Party party;

    @Column(name = "receipt_img")
    private String image;

    @Column(name = "prepaid_cost")
    private Integer prepaidCost;

    @Column(name = "cost")
    private Integer cost;

    @Column(name = "current_paid_cost")
    private Integer currentAmount;

    @Column(name = "member_id")
    private Long memberId;

    @Builder
    private PartySettlement(Party party, String image, Integer prepaidCost, Integer currentAmount, Integer cost, Long memberId) {
        this.party = party;
        this.image = image;
        this.prepaidCost = prepaidCost;
        this.currentAmount = currentAmount;
        this.cost = cost;
        this.memberId = memberId;
    }

    public static PartySettlement of(Party party, Integer prepaidCost, Long memberId) {
        return builder()
                .party(party)
                .prepaidCost(prepaidCost)
                .currentAmount(0)
                .memberId(memberId)
                .build();
    }

    // 연관관계 편의 메서드
    public void updateParty(Party party) {
        this.party = party;

        if (party.getPartySettlement() != this) {
            party.updatePartySettlement(this);
        }
    }

    public void updateSettlementInfo(String image, Integer cost, Long memberId) {
        this.image = image;
        this.cost = cost;
        this.memberId = memberId;
        this.currentAmount = this.prepaidCost;
    }

    public void paidCost(Integer cost) {
        this.currentAmount += cost;
    }

}
