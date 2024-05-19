# 🍇OD!

## 📌 개요
### 🚕 서비스 설명
- 택시를 같이 탈 사람을 구하는 서비스
- 목적지에 도착시 불필요한 개인 정보 교환 없이 정산 가능
### ✨ 기획의도
- 택시 기본요금의 지속적 상승으로 택시비용이 비싸지는 추세
- 많은 사람들이 택시를 동승하려하는 경향이 나타남
- 동승을 구하는 플랫폼이 하나로 정해지지 않았으며, 정산을 할때 먹튀 혹은 개인정보 노출의 위험성이 존재

**택시 동승을 위한 매칭 서비스 부터 안전한 정산 서비스까지 제공하고자 함**

## 🏆 주요 기능
- **택시 동승자 매칭 기능**
- **동승 파티 내 채팅**
- **동승 자동 매칭**
- **토스 결제 기능**
- **매칭 알림 기능**
- **택시비 정산 기능**
- **소셜 로그인**


## 💻 개발 환경
### ⚙ 기술 스택
**BE**

<img  src="https://img.shields.io/badge/Spring Boot-6DB33F?style=flat-square&logo=Spring Boot&logoColor=white"/> <img  src="https://img.shields.io/badge/springsecurity-6DB33F?style=flat-square&logo=springsecurity&logoColor=white"/> <img  src="https://img.shields.io/badge/spring JPA-6DB33F?style=flat-square&logo=spring&logoColor=white"/> <img  src="https://img.shields.io/badge/REDIS-DC382D?style=flat-square&logo=REDIS&logoColor=white"/> <img  src="https://img.shields.io/badge/swagger-85EA2D?style=flat-square&logo=swagger&logoColor=white"/> <img src="https://img.shields.io/badge/mariadb-003545?style=flat-square&logo=mariadb&logoColor=white"/> <img  src="https://img.shields.io/badge/mysql-4479A1?style=flat-square&logo=mysql&logoColor=white"/>

**FE**

 <img  src="https://img.shields.io/badge/typescript-3178C6?style=flat-square&logo=typescript&logoColor=white"/> <img  src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=React&logoColor=white"/> <img  src="https://img.shields.io/badge/tailwindcss-06B6D4?style=flat-square&logo=React&logoColor=white"/> <img  src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=Vite&logoColor=white"/> <img  src="https://img.shields.io/badge/axios-5A29E4?style=flat-square&logo=axios&logoColor=white"/> <img  src="https://img.shields.io/badge/daisyui-5A0EF8?style=flat-square&logo=daisyui&logoColor=white"/> <img  src="https://img.shields.io/badge/reactrouter-CA4245?style=flat-square&logo=reactrouter&logoColor=white"/> <img  src="https://img.shields.io/badge/framer-0055FF?style=flat-square&logo=framer&logoColor=white"/> <img  src="https://img.shields.io/badge/reactquery-FF4154?style=flat-square&logo=reactquery&logoColor=white"/>



### 협업
 <img  src="https://img.shields.io/badge/notion-000000?style=flat-square&logo=notion&logoColor=white"/>  <img  src="https://img.shields.io/badge/figma-F24E1E?style=flat-square&logo=figma&logoColor=white"/> <img  src="https://img.shields.io/badge/jirasoftware-0052CC?style=flat-square&logo=jirasoftware&logoColor=white"/> <img  src="https://img.shields.io/badge/gitlab-FC6D26?style=flat-square&logo=gitlab&logoColor=white"/>  <img  src="https://img.shields.io/badge/mattermost-0058CC?style=flat-square&logo=mattermost&logoColor=black"/>  <img  src="https://img.shields.io/badge/discord-5865F2?style=flat-square&logo=discord&logoColor=black"/>
 
### 배포
<img  src="https://img.shields.io/badge/amazonec2-FF9900?style=flat-square&logo=amazonec2&logoColor=black"/> <img  src="https://img.shields.io/badge/jenkins-D24939?style=flat-square&logo=jenkins&logoColor=black"/> <img  src="https://img.shields.io/badge/docker-2496ED?style=flat-square&logo=docker&logoColor=white"/> <img  src="https://img.shields.io/badge/nginx-009639?style=flat-square&logo=nginx&logoColor=white"/> <img  src="https://img.shields.io/badge/elasticsearch-005571?style=flat-square&logo=elasticsearch&logoColor=white"/>  <img  src="https://img.shields.io/badge/kibana-005571?style=flat-square&logo=kibana&logoColor=white"/>  <img  src="https://img.shields.io/badge/logstash-005571?style=flat-square&logo=logstash&logoColor=white"/> <img  src="https://img.shields.io/badge/amazons3-569A31?style=flat-square&logo=amazons3&logoColor=white"/> 


### 🗓프로젝트 기간
**`2024.04.08~2024.05.20`**

## 📺 서비스 화면
### 로그인
|![로그인](/uploads/f37b224f51f3b184ba74412258f723ec/로그인.gif)|
|--|
|**네이버 로그인 기능**|
|소셜 로그인을 활용하여 로그인 및 회원가입이 가능합니다.|

### 메인 화면
|![홈화면_목록](/uploads/e3ac3a5e91b8b7ca098368972bd4d71f/홈화면_목록.gif)|
|--|
|**구글 지도 현 위치 불러오기 및 주변 택시 파티 불러오기**|
|로그인을 한 후 나오는 메인 페이지 입니다. 현 위치를 받아서 지도에 보여주며 현위치를 기준으로 주변에 있는 동승 파티 정보들을 지도에서 보여줍니다.|

### 파티 생성
|![파티생성](/uploads/c429f31fbb090b471b72a7f89ca06773/파티생성.gif)|
|--|
|**택시 동승 파티 생성 기능**|
|출발지와 도착지를 검색하여 저장한 후 파티 옵션(동성 여부 및 카테고리)선택 하여 택시 동승 파티를 생성합니다.|

### 파티 신청 및 수락
|   |
|--|
|**택시 동승 파티에 참여 신청 기능**|
|택시 파티에 참여 신청 및 수락할 수 있습니다. 신청 및 수락시 알림이 옵니다.|

### 파티 채팅
|   |
|--|
|**파티 내 채팅**|
|파티에 참여자로 수락이 되면 파티 참여자들과 채팅을 할 수 있습니다.
채팅을 통해 서로 소통하여 만남을 상세히 정할 수 있습니다.|

### 정산 기능
|![정산요청](/uploads/2392cbb64bb6966372ec3630a71bfcff/정산요청.gif)|
|--|
|**동승 완료 후 정산**|
|동승 완료 후 영수증 첨부와 함께 정산을 요청하면, 나머지 참여자들이 실제 금액을 바탕으로 1/N으로 정산금액을 지불 할 수 있습니다.|

### 자동 매칭
|![자동매칭](/uploads/b8552e52a2f2ff5ff862bafe4e16ace7/자동매칭.gif) ![자동매칭](/uploads/b8552e52a2f2ff5ff862bafe4e16ace7/자동매칭.gif)|
|--|
|**택시 동승 자동매칭 기능**|
|자동매칭에 출발지와 목적지를 적어 매칭시작을 누르면 출발지와 목적지 근방 1km 내에 해당하는 사람과 매칭해줍니다.|

### 동승자 평가
|   |
|--|
|**정산 후 동승자 평가 기능**|
|정산을 한 후 동승자들의 종합적인 평가를 진행합니다. 해당 평가는 종합적인 부분을 판단하여 추후 해당사용자의 매너 당도에 평가에 반영됩니다.|


## 🗺️ 설계 문서
### ERD
![erd](/uploads/ddb911c78fa51c5682605e74577f5492/erd.png)
### 아키텍처
![아키텍처](/uploads/78aeb76e97ed57043a6c4c981bf02080/아키텍처.png)

## 🖋️ 요구사항 명세서
![스웨거1](/uploads/0b758f6f5818e6ebded17324cf36efc7/스웨거1.png)
![스웨거2](/uploads/62a874a83fe858b1f9750ef78ab44cfb/스웨거2.png)
![스웨거3](/uploads/c747700cf4a796b84624dcf10dfde46d/스웨거3.png)
![스웨거4](/uploads/f0cf49648765d520fc304ee81bcdebf8/스웨거4.png)
![스키마1](/uploads/f94dd413771b2a6b2ce813189455f887/스키마1.png)
![스키마2](/uploads/ecf0a3c8c4a0a70b65455ecf8276f654/스키마2.png)
![스키마3](/uploads/d86a84e72c55a452c14f49c98d124635/스키마3.png)
![스키마4](/uploads/aebc2522bff9694c876734ee0f40605b/스키마4.png)
