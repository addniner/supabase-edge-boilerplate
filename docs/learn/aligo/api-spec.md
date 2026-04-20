API SPEC 및 연동예제 안내
문자보내기 및 관련 API 사용시 아래내용을 반드시 참고하여 주시기 바랍니다.
현재 제공되는 문자연동 API는 다음과 같습니다.

문자보내기 - 동일내용을 1천명에게 동시전송
문자보내기(대량) - 각기 다른내용을 5백명에게 동시 전송
전송내역조회 - 최근발송된 전송내역조회
전송결과조회(상세) - 전화번호별 성공유무 조회
발송가능건수 - 잔여건수 조회
예약문자 취소 - 예약대기중 문자 취소요청
문자보내기
동일한 내용의 문자를 컴마(,)로 분기하여 동시 1천명에게 전송하실 수 있습니다.
발신번호는 사이트내에서 미리 등록된 번호만 사용하실 수 있습니다.
msg_type을 지정하지 않으시면 90byte를 초과하는 메시지 발송 시 LMS(첨부파일 없는 MMS) 형태로 자동 전환됩니다.
(단, 시스템별 개행문자등의 Byte가 다를 수 있으므로 전송전 90Byte 체크를 하여 msg_type을 지정하시는것을 권장합니다.)

✱ 통신사의 웹 문자 발송 시스템은 기본적으로 EUC-KR 인코딩 방식을 사용하고 있습니다.
     문자 내용에 EUC-KR이 지원하지 않는 특수문자/이모지 입력 시 물음표(?) 등으로 변환될 수 있으니 테스트 발송으로
     확인해주시기 바랍니다.

[ Request ]

POST /send/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다. 예약설정을 통해 예약문자로 등록이 가능하며, 파일첨부를 통해 MMS 전송이 가능합니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
sender	발신자 전화번호 (최대 16bytes)	O	String
receiver	수신자 전화번호 - 컴마(,)분기 입력으로 최대 1천명	O	String
msg	메시지 내용	O	String (1~2,000Byte)
msg_type	SMS(단문) , LMS(장문), MMS(그림문자) 구분	X	String
title	문자제목(LMS,MMS만 허용)	X	String (1~44Byte)
destination	%고객명% 치환용 입력	X	String
rdate	예약일 (현재일이상)	X	YYYYMMDD
rtime	예약시간 - 현재시간기준 10분이후	X	HHII
image1	첨부이미지 (image 또는 image1)	X	JPEG,PNG,GIF
image2	첨부이미지	X	JPEG,PNG,GIF
image3	첨부이미지	X	JPEG,PNG,GIF
testmode_yn	연동테스트시 Y 적용	X	String
예를 들면,

curl -X POST "https://apis.aligo.in/send/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx" \
	--data-urlencode "sender=025114560" \
	--data-urlencode "receiver=01111111111,01111111112" \
	--data-urlencode "destination=01111111111|홍길동,01111111112|아무개" \
	--data-urlencode "msg=%고객명%님! 안녕하세요. API TEST SEND" \
	--data-urlencode "title=API TEST 입니다" \
	--data-urlencode "rdate=20260117" \
	--data-urlencode "rtime=2341" \
	--data-urlencode "testmode_yn=Y" \
	--form image=@localfilename
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
msg_id	메시지 고유 ID	Integer
success_cnt	요청성공 건수	Integer
error_cnt	요청실패 건수	Integer
msg_type	메시지 타입 (1. SMS, 2.LMS, 3. MMS)	String
위 2건의 수신번호를 ,로 분기하여 전송한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": 1
	    "message": ""
	    "msg_id": 123456789
	    "success_cnt": 2
	    "error_cnt": 0
	    "msg_type": "SMS"
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": -101
	    "message": "인증오류입니다."
	}
testmode_yn 을 Y로 설정하시는 경우 과금프로세스와 실제문자 전송을 제외한 나머지가 실제와 동일하게 동작이 되므로 연동작업시 유용하게 사용하실 수 있습니다.

 

문자보내기(대량)
각각 다른 내용의 문자를 500명에게 동시 전송하실 수 있습니다.
사이트내 엑셀전송하기와 동일한 기능이며, 수신인1~500 / 내용1~500 을 각각 설정할 수 있습니다.
단문(SMS),장문(LMS) 구분을 직접 선택하셔야 하며 혼용은 불가합니다.
title(문자제목)항목은 LMS,MMS에만 적용되며, 설정시 1~500번 문자에 공통으로 적용됩니다.
그림문자(사진첨부) 전송시 수신번호별 개별설정이 불가능하므로 동일사진 첨부시에만 사용하시기 바랍니다.

[ Request ]

POST /send_mass/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다. 예약설정을 통해 예약문자로 등록이 가능하며, 파일첨부를 통해 MMS 전송이 가능합니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
sender	발신자 전화번호 (최대 16bytes)	O	String
rec_1	수신자 전화번호1	O	String
msg_1	메시지 내용1	O	String (1~2,000Byte)
rec_2 ~ rec_500	수신자 전화번호2 ~ 500	X	String
msg_2 ~ msg_500	메시지 내용	X	String (1~2,000Byte)
cnt	메시지 전송건수(번호,메시지 매칭건수)	O	Integer(1~500)
title	문자제목(LMS,MMS만 허용)	X	String (1~44Byte)
msg_type	SMS(단문) , LMS(장문), MMS(그림문자) 구분	O	String
rdate	예약일 (현재일이상)	X	YYYYMMDD
rtime	예약시간 - 현재시간기준 10분이후	X	HHII
image1	첨부이미지 (image 또는 image1)	X	JPEG,PNG,GIF
image2	첨부이미지	X	JPEG,PNG,GIF
image3	첨부이미지	X	JPEG,PNG,GIF
testmode_yn	연동테스트시 Y 적용	X	String
예를 들면,

curl -X POST "https://apis.aligo.in/send_mass/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx" \
	--data-urlencode "sender=025114560" \
	--data-urlencode "rec_1=01111111111" \
	--data-urlencode "msg_1=안녕하세요. 홍길동님! 반갑습니다." \
	--data-urlencode "rec_2=01111111112" \
	--data-urlencode "msg_2=반갑습니다. 아무개님." \
	--data-urlencode "rec_3=01111111113" \
	--data-urlencode "msg_3=알리고에서 알려드립니다." \
	--data-urlencode "cnt=3" \
	--data-urlencode "msg_type=LMS" \
	--data-urlencode "title=알리고 공지" \
	--data-urlencode "rdate=20260117" \
	--data-urlencode "rtime=2341" \
	--data-urlencode "testmode_yn=Y" \
	--form image=@localfilename
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
msg_id	메시지 고유ID	Integer
success_cnt	요청성공 건수	Integer
error_cnt	요청실패 건수	Integer
msg_type	메시지 타입 (1. SMS, 2.LMS, 3. MMS)	String
위 3건의 수신번호로 전송한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": 1
	    "message": ""
	    "msg_id": 123456789
	    "success_cnt": 3
	    "error_cnt": 0
	    "msg_type": "SMS"
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": -101
	    "message": "인증오류입니다."
	}
testmode_yn 을 Y로 설정하시는 경우 과금프로세스와 실제문자 전송을 제외한 나머지가 실제와 동일하게 동작이 되므로 연동작업시 유용하게 사용하실 수 있습니다.

 

전송내역조회
최근 요청및 처리된 전송내역을 조회하실 수 있습니다.
사이트내 전송결과조회 페이지와 동일한 내역이 조회되며, 날짜기준으로 조회가 가능합니다.
발신번호별 조회기능은 제공이 되지 않습니다.
조회시작일을 지정하실 수 있으며, 시작일 이전 몇일까지 조회할지 설정이 가능합니다.
조회시 최근발송내역 순서로 소팅됩니다.

[ Request ]

POST /list/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
page	페이지번호	X(기본 1)	Integer
page_size	페이지당 출력갯수	X(기본 30) 30~500	Integer
start_date	조회시작일자	X(기본 최근일자)	YYYYMMDD
limit_day	조회마감일자	X	Integer
오늘기준 7일전 날짜의(1월 10일 0시 ~ 24시) 전송내역 조회를 예로 들면,

curl -X POST "https://apis.aligo.in/list/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx" \
	--data-urlencode "page=1" \
	--data-urlencode "page_size=50" \
	--data-urlencode "start_date=20260110" \
	--data-urlencode "limit_day=1"
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
list	목록 배열	Array
next_yn	다음조회목록 유무	String
list 배열
키	설명	타입
mid	메시지ID	Integer
type	문자구분(유형)	String
sender	발신번호	String
sms_count	전송요청수	Integer
reserve_state	요청상태	String
msg	메시지 내용	String
fail_count	처리실패건수	Integer
reg_date	등록일	YYYY-MM-DD HH:ii:ss
reserve	예약일자	YYYY-MM-DD HH:ii:ss
최근 발송된 2건을 조회한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": 1
	    "message": "success"
	    "list": [{
			"mid": "123456788"
			"type": "SMS"
			"sender": "025114560"
			"sms_count": "2"
			"reserve_state": "예약대기중"
			"msg": "%고객명%님! API 전송테스트 입니다."
			"fail_count": "0"
			"reg_date": "2026-01-17 22:06:26"
			"reserve": "2026-01-17 23:41:26"
			} {
			"mid": "123456789"
			"type": "SMS"
			"sender": "025114560"
			"sms_count": "1"
			"reserve_state": "전송완료"
			"msg": "%고객명%님! API 전송테스트 입니다."
			"fail_count": "0"
			"reg_date": "2026-01-17 21:41:26"
			"reserve": ""
		} ]
	    "next_yn": "Y"
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	"result_code": -101
	"message": "인증오류입니다."
	}
testmode_yn 을 Y로 설정하시는 경우 실제 전송이 되지 않으므로 전송결과 조회에는 전송결과 조회에는 취소완료로 나오게 됩니다. 이는 정상적으로 API가 동작된 것이므로 테스트연동시 참고해 주세요.

 

전송결과조회(상세)
send , send_mass에서 리턴되는 msg_id 또는 list API에서 조회되는 mid를 사용하여 수신번호별 상태를 조회하실 수 있습니다.
수신전화번호별 전송상태를 조회하실 수 있으며 목록에 없거나 전송중인 문자는 만24시간동안 전송시도중인것입니다.
최종 24시간이 경과 후 조회하셔야 완료된 내역을 확인하실 수 있습니다.

[ Request ]

POST /sms_list/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다. 통신사에 전달 후 전송결과가 통보되지 않은 경우에는 목록에 나오지 않거나, 전송중으로 나올 수 있습니다. 24시간 후 최종 결과를 확인하시기 바랍니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
mid	메시지 고유ID	O	Integer
page	페이지번호	X(기본 1)	Integer
page_size	페이지당 출력갯수	X(기본 30) 30~500	Integer
msg_id 123456789 의 전송결과 상세 조회를 예로 들면,

curl -X POST "https://apis.aligo.in/sms_list/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx" \
	--data-urlencode "mid=123456678" \
	--data-urlencode "page=1" \
	--data-urlencode "page_size=50"
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
list	목록 배열	Array
next_yn	다음조회목록 유무	String
list 배열
키	설명	타입
mdid	메시지 상세ID	Integer
type	문자구분(유형)	String
sender	발신번호	String
receiver	수신번호	String
sms_state	전송상태	String
reg_date	등록일	YYYY-MM-DD HH:ii:ss
send_date	전송일	YYYY-MM-DD HH:ii:ss
reserve_date	예약일	YYYY-MM-DD HH:ii
최근 발송된 2건을 조회한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	"result_code": 1
	"message": "success"
	"list": [{
	"mdid": "987654321"
	"type": "SMS"
	"sender": "025114560"
	"receiver": "01111111111"
	"sms_state": "발송완료"
	"reg_date": "2026-01-17 22:06:26"
	"send_date": "2026-01-17 22:07:58"
	"reserve_date": ""
	} {
	"mdid": "987654321"
	"type": "SMS"
	"sender": "025114560"
	"receiver": "01111111112"
	"sms_state": "가입자없음"
	"reg_date": "2026-01-17 22:06:26"
	"send_date": "2026-01-17 22:07:58"
	"reserve_date": ""
	} ]
	"next_yn": "N"
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	"result_code": -101
	"message": "인증오류입니다."
	}
testmode_yn을 Y로 설정시 sms_list 결과에는 노출되지 않으니 실발송 후 사용하시기 바랍니다.

 

발송가능건수
보유한 잔여포인트로 발송가능한 잔여건수를 문자구분(유형)별로 조회하실 수 있습니다.
SMS, LMS, MMS로 발송시 가능한 잔여건수이며 남은 충전금을 문자유형별로 보냈을 경우 가능한 잔여건입니다.
예를들어 SMS_CNT : 11 , LMS_CNT : 4 인 경우 단문전송시 11건이 가능하고, 장문으로 전송시 4건이 가능합니다.

[ Request ]

POST /remain/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
예를 들면,

curl -X POST "https://apis.aligo.in/remain/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx"
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
SMS_CNT	단문전송시 발송가능한건수	Integer
LMS_CNT	단문전송시 발송가능한건수	Integer
MMS_CNT	그림(사진)전송시 발송가능한건수	Integer
조회에 성공한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": 1
	    "message": ""
	    "SMS_CNT": 5555
	    "LMS_CNT": 1930
	    "MMS_CNT": 833
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": -101
	    "message": "인증오류입니다."
	}
send API 호출시 1만 포인트이하 보유시 1회, 잔여포인트소진으로 발송중지전 1회의 문자통보가 자동발송되고 있습니다.
send_mass API 사용시 50만 포인트이하 보유시 1회, 잔여포인트소진으로 발송중지전 1회의 문자통보가 자동발송되고 있습니다.
그외 특정건수 이하 보유시 통보를 원하시는 경우 remain API를 사용하여 조회하신 후 send API로 통보되도록 구축하시기 바랍니다.

 

예약문자 취소
send, send_mass API를 통해 예약한 내역을 전송취소할 수 있습니다.
예약취소는 발송전 5분이전의 문자만 가능합니다.

[ Request ]

POST /cancel/ HTTP/1.1
	Host: apis.aligo.in
	Service Port: 443
HTTPS 프로토콜을 사용하여 POST로 요청합니다.

키	설명	필수	타입
key	인증용 API Key	O	String
user_id	사용자id	O	String
mid	메시지ID	O	Integer
예를 들면,

curl -X POST "https://apis.aligo.in/cancel/" \
	--data-urlencode "key=xxxxx" \
	--data-urlencode "user_id=xxxxx" \
	--data-urlencode "mid=123456789"
[Response]

응답 바디는 JSON 객체로 구성됩니다.

JSON
키	설명	타입
result_code	결과코드(API 수신유무)	Integer
message	결과 메시지( result_code 가 0 보다 작은경우 실패사유 표기)	String
cancel_date	취소일자	YYYY-MM-DD HH:II:SS
정상취소가 완료된 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
		    "result_code": 1
		    "message": ""
		    "cancel_date": "2026-01-17 22:41:26"
	}
전송요청이 실패한 경우를 예로들면,

HTTP/1.1 200 OK
	Content-Type: application/json;charset=UTF-8
	{
	    "result_code": -804
	    "message": "발송 5분전까지만 취소가 가능합니다."
	}
연동형 API로 처리 실패시 message 항목의 안내문구를 참고하여 주시기 바랍니다.

