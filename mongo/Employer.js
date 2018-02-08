var db = require('./dbc.js');
var Employers = db.dbc.collection('Employers');
var HH = db.dbc.collection('Hirings');
var RR = db.dbc.collection('Resumes');
var AA = db.dbc.collection('Applicants');
var Applicant = require('../mongo/Applicant.js');
var Resumes = require('../mongo/Resume.js');
var Hirings = require('../mongo/Hiring.js');
var ObjectID = require("mongodb").ObjectID;
exports.employerSave = function(employer,callback){
	Employers.save(employer,function(err){
		if(err){
			return callback(err);
		}
		callback(null);
	});
	//console.log(employer);
};

exports.employerFind = function(EmployerAccount,callback){
	//console.log("待查找的用户"+EmployerAccount);
	Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		//console.log("雇主"+doc);
	});
};
 exports.employerFindByID = function(EmployerID,callback){
     Employers.findOne({_id:EmployerID},function(err,doc){
        if(err){
           return callback(err,null);
        }
        // console.log("通过ID 查找雇主"+doc);
        callback(null,doc);

        });
 }
exports.Online = function(EmployerAccount,callback){
    Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
            doc.OnlineStatus='1' ;
        Employers.save(doc,function(err){
            if(err){
                return callback(err,null)
            }
            callback(null,doc)
        })
    });
}
exports.Outline = function(EmployerAccount,callback){
    Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
        doc.OnlineStatus='0' ;
        Employers.save(doc,function(err){
            if(err){
                return callback(err,null)
            }
            callback(null,doc)
        })
    });
}
exports.addHiringID = function(EmployerID,HiringID,callback){
    Employers.update({_id:EmployerID},{$addToSet:{EmployerHiringIDList:HiringID}},function(err){
        if(err){
            return callback(err);
        }
        callback(null);
    });
}

exports.applicantresumeFind1 = function(EmployerAccount,callback){
    Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
        var applicantresume =[]; //////////////////////
        var myhiringlist = doc.EmployerHiringIDList;
       // console.log(myhiringlist);
        for(var i=0;i<myhiringlist.length;i++){
            var HiringID = myhiringlist[i];
            Hirings.hiringFindByID(HiringID,function(err,hiring){
                if(err){
                    return callback(err,null);
                }
                var hiringapplicantresumelist = hiring.ApplicantResumeIDList ;
                for(var j=0;j<hiringapplicantresumelist.length;j++){
                    var ResumeID = hiringapplicantresumelist[j];
                    Resumes.resumeFindByID(ResumeID,function(err,resume){
                        if(err){
                            return callback(err,null);
                        }
                        applicantresume.push(resume);
                        //console.log("投递的简历列表："+applicantresume);
                    })
                }
            })
        }
        return callback(null,applicantresume);
    })
}
/*exports.applicantresumeFind = function(EmployerAccount,callback){
    Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
        var applicantresume =[]; //////////////////////
        var myhiringlist = doc.EmployerHiringIDList;
        myhiringlist.forEach(function(HiringID,index){
            console.log("foreach"+ HiringID);
            //applicantresume.push(HiringID);
            Hirings.hiringFindByID(HiringID,function(err,hiring){
                if(err){
                    return callback(err,null);
                }

                    var hiringapplicantresumelist = hiring.ApplicantResumeIDList;
                    console.log("foreach11:"+ hiringapplicantresumelist);

                    hiringapplicantresumelist.forEach(function(applicantResumeID){
                        console.log("申请者的简历ID:"+ applicantResumeID);
                        Resumes.resumeFindByID(applicantResumeID,function(err,resume){
                            if(err){
                                return callback(err,null);
                            }

                                var ApplicantName = resume.ResumeApplicantContactInfo.ApplicantName;
                                var apply ={
                                    HiringPositionName:hiring.HiringPositionName,
                                    ResumeID:resume._id,
                                    ApplicantName:ApplicantName
                                }
                                applicantresume.push(apply);
                                //applicantresume.push(resume);
                                console.log("投递的简历列表："+applicantresume.length);
                               // return callback(null,applicantresume);  ///////////////////?为啥要放在这 不是下面？

                        })
                    })

            })
            //console.log("1234567890:"+applicantresume.length);
        });

        return callback(null,applicantresume);
       })
    }
*/

 /*
exports.applicantresumeFind = function(EmployerAccount,callback){
    var applicantresume = [];
    var hiring = HH.find({_id:ObjectID("519303a13c9a4db825000001")}).toArray();
    console.log(hiring[0]);
    var resume = RR.find({_id:{$in:hiring[0].ApplicantResumeIDList}}).toArray();
    console.log(resume);
    resume.forEach(function(doc){
        var ApplicantName = doc.ResumeApplicantContactInfo.ApplicantName;
        var apply ={
            HiringPositionName:hiring.HiringPositionName,
            ResumeID:doc._id,
            ApplicantName:ApplicantName
        }
        applicantresume.push(apply);
    })
    callback(applicantresume);
}
   */

exports.applicantresumeFind = function(EmployerAccount,callback){
    Employers.findOne({EmployerAccount:EmployerAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
        var applicantresume =[]; //////////////////////
        var myhiringlist = doc.EmployerHiringIDList;
        myhiringlist.forEach(function(HiringID,index){
            console.log("foreach"+ HiringID);
            //applicantresume.push(HiringID);
            Hirings.hiringFindByID(HiringID,function(err,hiring){
                if(err){
                    return callback(err,null);
                }
                var hiringapplicantresumelist = hiring.ApplicantResumeIDList;
                var applytotalnum ={
                    HiringPositionName:hiring.HiringPositionName,
                    HiringID:hiring.HiringID,
                    ApplicantResumeIDlist:hiringapplicantresumelist
                }
                applicantresume.push(applytotalnum);
                console.log("foreach11:"+ hiringapplicantresumelist);return callback(null,applicantresume);
            })
            //console.log("1234567890:"+applicantresume.length);
        });

    })
}
exports.updateHiringList = function(EmployerAccount,HiringID,callback){
    Employers.update({EmployerAccount:EmployerAccount},{$pull:{EmployerHiringIDList:HiringID}},function(err){
        if(err){
            return callback(err);
        }
        return callback(null);
    });
}
