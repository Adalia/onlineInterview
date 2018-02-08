var db = require('./dbc.js');
var Hirings = db.dbc.collection('Hirings');
var ObjectID = require("mongodb").ObjectID;
var Resumes = require('../mongo/Resume.js');
var Employer = require('../mongo/Employer.js');
exports.hiringSave=function(hiring,callback){
    Hirings.save(hiring,function(err){
        //console.log(hiring.HiringPositionName);
        if(err){
            return callback(err);
        }
        callback(null);

    });
};

exports.hiringFind = function(EmployerID,callback){  //查找某个求职者的某个简历-----待改
	Hirings.findOne({EmployerID:EmployerID},function(err,doc){
		if(err){
			return callback(err,null);
		}
		callback(null,doc);
		//console.log("雇主"+doc);
	});
};

var hiringFindByID = exports.hiringFindByID = function(HiringID,callback){  //查找某个职位
	Hirings.findOne({_id:HiringID},function(err,doc){
		///console.log("查找某个简历123:"+HiringID);
		if(err){
			return callback(err,null);
		}
       // console.log("要查看的职位信息"+doc._id);
		callback(null,doc);

	});
};

exports.employerHiringFind=function(EmployerID,callback){   //查找某个求职者的所有职位
	//console.log("Hiring.js 中得到的雇主ID："+EmployerID);
    Hirings.find({EmployerID:EmployerID}).sort('-_id').toArray(function(err,docs){
	    console.log("docs");
        if(err){
            return callback(err,null);
        }
        var employerhirings=[];
        docs.forEach(function(doc)
        {
			console.log("foreach");
            employerhirings.push(doc);
        });
        callback(null,employerhirings);
    })
};
exports.hiringDelete = function(hiringID,EmployerAccount,callback){
    Hirings.remove({_id:ObjectID(hiringID)},function(err){
        if(err){
            return callback(err);
        }
        Employer.updateHiringList(EmployerAccount,ObjectID(hiringID),function(err){
            if(err){
                return callback(err);
            }
            callback(null);
        })

    });
}

exports.allhiringFind=function(callback){
   Hirings.find().sort('-_id').toArray(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var hirings=[];
        docs.forEach(function(doc)
        {
            hirings.push(doc);
        });
        callback(null,hirings);
    })
};
exports.employerHiringFindOne=function(EmployerID,HiringPositionName,callback){//查找某个求职者的某份简历
    Hirings.findOne({EmployerID:EmployerID,HiringPositionName:HiringPositionName},function(err,doc){
        if(err){
            return callback(err,null);
        }
        callback(null,doc);
    });
};
exports.addApplicantResumeID = function(ResumeID,HiringID,callback){
    Hirings.update({_id:HiringID},{$addToSet:{ApplicantResumeIDList:ResumeID}},function(err){
        if(err){
            return callback(err);
        }
        callback(null);
    });
}
exports.applicantresumeFind = function(HiringID,callback){
    hiringFindByID(HiringID,function(err,hiring){
        if(err){
            return callback(err,null);
        }
        var hiringapplicantresumelist = hiring.ApplicantResumeIDList;
        //console.log("foreach11:"+ hiringapplicantresumelist);
        Resumes.resumeFindByIDList(hiringapplicantresumelist,function(err,applyresumes){
            if(err){
                return callback(err,null);
            }
            return callback(null,applyresumes);
        })
    })
}