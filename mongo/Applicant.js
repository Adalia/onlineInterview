var db = require('./dbc.js');
var Applicants = db.dbc.collection('Applicants');

exports.applicantSave = function(applicant,callback){
	Applicants.save(applicant,function(err){
		if(err){
			return callback(err);
		}
		callback(null);
	});
	//console.log(applicant);
};
exports.applicantFind = function(ApplicantAccount,callback){
	Applicants.findOne({ApplicantAccount:ApplicantAccount},function(err,doc){
	   console.log(ApplicantAccount);
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		console.log("求职者"+doc);
	});
};
var applicantFindByID = exports.applicantFindByID = function(ApplicantID,callback){
    Applicants.findOne({_id:ApplicantID},function(err,doc){
        console.log(ApplicantID);
        if(err){
            return callback(err,null);
        }
        callback(null,doc);
        console.log("求职者"+doc);
    });
};
exports.Online = function(ApplicantAccount,callback){
    Applicants.findOne({ApplicantAccount:ApplicantAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
            doc.OnlineStatus='1' ;
        Applicants.save(doc,function(err){
            if(err){
                return callback(err,null)
            }
            callback(null,doc)
        })
    });
}
exports.Outline = function(ApplicantAccount,callback){
    Applicants.findOne({ApplicantAccount:ApplicantAccount},function(err,doc){
        if(err){
            return callback(err,null);
        }
        doc.OnlineStatus='0' ;
        Applicants.save(doc,function(err){
            if(err){
                return callback(err,null)
            }
            callback(null,doc)
        })
    });
}
exports.addResumeID = function(ApplicantID,ResumeID,callback){
         Applicants.update({_id:ApplicantID},{$addToSet:{ApplicantResumeIDList:ResumeID}},function(err){
             if(err){
                 return callback(err);
             }
             callback(null);
         });
}
exports.updateResumeList = function(ApplicantAccount,ResumeID,callback){
    Applicants.update({ApplicantAccount:ApplicantAccount},{$pull:{ApplicantResumeIDList:ResumeID}},function(err){
        if(err){
            return callback(err);
        }
        return callback(null);
    });
}

