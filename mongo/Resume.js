var db = require('./dbc.js');
var Resumes = db.dbc.collection('Resumes');
var ObjectID = require("mongodb").ObjectID;
var Applicant = require('../mongo/Applicant.js');

exports.resumeSave=function(resume,callback){
    Resumes.save(resume,function(err){
        console.log(resume.ResumeName);
        if(err){
            return callback(err);
        }
       callback(null);
    });
};

exports.resumeFind = function(ApplicantID,callback){  //查找某个求职者的某个简历
	Resumes.findOne({ApplicantID:ApplicantID},function(err,doc){
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		console.log("雇主"+doc);
	});
};

exports.resumeFindByID = function(ResumeID,callback){  //查找某个简历
	Resumes.findOne({_id:ResumeID},function(err,doc){
		console.log("查找某个简历123:"+ResumeID);
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		console.log("查找某个简历"+doc);
	});
};
exports.resumeUpdate = function(updateResume,callback){
console.log("数据库更新1："+updateResume.ResumeName);
    console.log("数据库更新1："+updateResume.ResumeID);
    Resumes.update({_id:ObjectID(updateResume.ResumeID)},{$set:{
                ResumeName:updateResume.ResumeName
              /*  ResumeApplicantContactInfo:updateResume.ResumeApplicantContactInfo,
                ResumeSummary:updateResume.ResumeSummary,
                ResumeDetails:updateResume.ResumeDetails    */
    }},function(err){
        if(err){
            return callback(err);
        } console.log("数据库更新2："+updateResume.ResumeName);
        callback(null);
    });
};

exports.applicantResumeFind=function(ApplicantID,callback){   //查找某个求职者的所有简历
    Resumes.find({ApplicantID:ApplicantID}).sort('-_id').toArray(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var applicantresumes=[];
        docs.forEach(function(doc)
        {
            var resume={'ApplicantID':doc.ApplicantID,
                'ResumeName':doc.ResumeName,
                'ResumeApplicantContactInfo':doc.ResumeApplicantContactInfo,
                'ResumeSummary':doc.ResumeSummary,
                'ResumeDetails':doc.ResumeDetails,
				'ResumeID':doc._id
            };
            applicantresumes.push(resume);
        });
        callback(null,applicantresumes);
    });
};

 exports.applicantResumeFindOne=function(ApplicantID,ResumeName,callback){//查找某个求职者的某份简历
	Resumes.findOne({ApplicantID:ApplicantID,ResumeName:ResumeName},function(err,doc){
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		console.log("单个查询"+doc);
	});
};
exports.resumeDelete = function(resumeID,ApplicantAccount,callback){
    Resumes.remove({_id:ObjectID(resumeID)},function(err){
            if(err){
            return callback(err);
        }
        Applicant.updateResumeList(ApplicantAccount,ObjectID(resumeID),function(err){
            if(err){
                return callback(err);
            }
            callback(null);
        })

    });
}

exports.allresumeFind=function(callback){
    Resumes.find().sort('-_id').toArray(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var resumes=[];
        docs.forEach(function(doc)
        {
            resumes.push(doc);
        });
        callback(null,resumes);
    })
};
exports.addApplyhiringID = function(ResumeID,HiringID,callback){
    Resumes.update({_id:ResumeID},{$addToSet:{ApplyHiringIDList:HiringID}},function(err){
        if(err){
            return callback(err);
        }
        callback(null);
    });
}

exports.resumeFindByIDList = function(IDList,callback){
    Resumes.find({_id:{$in:IDList}}).toArray(function(err,docs){
        if(err){
            return callback(err,null);
        }
        return callback(null,docs);
    });
}