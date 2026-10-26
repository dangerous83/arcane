<?php
require __DIR__ . '/../server/arcane-lead.php';
$tests = 0;
function check_lead($condition, $message) { global $tests; if (!$condition) { throw new Exception($message); } $tests++; }
function sample_lead($id) { return array('name'=>'QA Example','email'=>'qa@example.invalid','phone'=>'+971 50 000 0000','company'=>'Example','message'=>'A test project','service'=>'Sculptural GRG','source'=>'Explore our work','website'=>'','request_id'=>str_pad(dechex($id),32,'0',STR_PAD_LEFT),'consent'=>'yes'); }
$valid = sample_lead(1); check_lead(!isset(arcane_lead_validate($valid)['error']), 'Valid enquiry rejected');
foreach (array('email'=>"qa@example.invalid\r\nBcc: victim@example.invalid",'phone'=>'123','service'=>'GRG','consent'=>'no','website'=>'bot.example','name'=>array('invalid'),'request_id'=>'../../bad') as $field=>$value) {
 $bad=$valid; $bad[$field]=$value; check_lead(isset(arcane_lead_validate($bad)['error']), 'Unsafe field accepted: '.$field);
}
$bad=$valid;$bad['message']=str_repeat('x',3001);check_lead(isset(arcane_lead_validate($bad)['error']),'Oversize message accepted');
check_lead(arcane_lead_origin_allowed('https://www.arcane.ae')&&!arcane_lead_origin_allowed('https://attacker.example'),'Origin restriction incorrect');
$directory=sys_get_temp_dir().'/arcane-lead-test-'.arcane_lead_random(6);$calls=0;
$sender=function($to,$subject,$body,$headers)use(&$calls){$calls++;check_lead($to==='info@arcane.ae'&&strpos($headers,'Reply-To: qa@example.invalid')!==false&&strpos($body,'Expertise: Sculptural GRG')!==false,'Email routing incorrect');return true;};
$now=time();$result=arcane_lead_store_send($valid,$directory,'client-1',$sender,$now);
check_lead(isset($result['ok'])&&$result['ok']===true,'Successful email not acknowledged');
$again=arcane_lead_store_send($valid,$directory,'client-1',$sender,$now);check_lead($again===$result&&$calls===1,'Retry caused duplicate email');
$saved=json_decode(file_get_contents($directory.'/'.$valid['request_id'].'.json'),true);check_lead($saved['delivery']==='queued'&&!isset($saved['enquiry']['website'])&&fileperms($directory.'/'.$valid['request_id'].'.json')%512===0600,'Private receipt incorrect');
$failure=arcane_lead_store_send(sample_lead(2),$directory,'client-2',function(){return false;},$now);
check_lead(isset($failure['status'])&&$failure['status']===503&&!isset($failure['ok']),'Mail failure falsely reported as success');
$saved=json_decode(file_get_contents($directory.'/'.sample_lead(2)['request_id'].'.json'),true);check_lead($saved['delivery']==='failed','Failed enquiry not retained');
for($i=10;$i<22;$i++){arcane_lead_store_send(sample_lead($i),$directory,'limited-client',function(){return true;},$now);}
$limited=arcane_lead_store_send(sample_lead(22),$directory,'limited-client',function(){throw new Exception('Rate-limited email attempted');},$now);check_lead($limited['status']===429,'Rate limit not enforced');
$after=arcane_lead_store_send(sample_lead(22),$directory,'limited-client',function(){return true;},$now+3601);check_lead(isset($after['ok']),'Rate limit did not expire');
$oldId=str_repeat('a',32);$oldFile=$directory.'/'.$oldId.'.json';file_put_contents($oldFile,'{}');touch($oldFile,$now-91*86400);file_put_contents($directory.'/keep.txt','preserve');arcane_lead_store_send(sample_lead(99),$directory,'retention-client',function(){return true;},$now);check_lead(!file_exists($oldFile)&&file_exists($directory.'/keep.txt'),'Retention removed unrelated files');
foreach(glob($directory.'/{*,.*}',GLOB_BRACE)as $file){if(is_file($file)){unlink($file);}}rmdir($directory);
echo 'Passed '.$tests." lead-handler checks. No real email was sent.\n";
