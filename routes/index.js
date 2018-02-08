var crypto=require('crypto');
var ObjectID = require("mongodb").ObjectID;
var Applicant = require('../mongo/Applicant.js');
var Employer = require('../mongo/Employer.js');
var Resumes = require('../mongo/Resume.js');
var Hirings = require('../mongo/Hiring.js');
var fs=require('fs');
var path=require('path');


module.exports=function(app){
app.get('/',function(req,res){
    Hirings.allhiringFind(function(err,hirings){
        if(err){
            hirings=[];
        }
    console.log(hirings);
	res.render('index.html',{title: '首页',
                          user:req.session.user,
                          hirings:hirings,
                          success:req.flash('success').toString(),
                          error:req.flash('error').toString()
	    });
    })
});
app.get('/register',checkNotLogin);
app.get('/register',function(req,res){
	res.render('register.html',{
				title:'用户注册',
				user:req.session.user,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()});
});
app.post('/reg_check',checkNotLogin);
app.post('/reg_check',function(req, res){
	var useraccount=req.body.UserAccount;
	Applicant.applicantFind(useraccount,function(err,applicant){
		if(!err){
			if(applicant){
				res.json({"statue":"1"});//邮箱已被注册（求职者）
			}else{//若求职者中没有此邮箱，则查找招聘者中的信息
				Employer.employerFind(useraccount,function(err,employer){
					if(!err){
						if(employer){
							res.json({"statue":"1"}); //邮箱在求职者中被注册
						}else{
							res.json({"statue":"0"});//正确
						}
					}
				});
			}
		}else{
        req.flash('error', err);
		return res.redirect('/register');
		}
		
	});
 });							   
//post 提交注册
app.post('/register',checkNotLogin);
app.post('/register',function(req, res) {
	var md5=crypto.createHash('md5');
	var password=md5.update(req.body.UserPassword).digest('base64');
	var userrole=req.body.UserRole;
	console.log("角色："+userrole);
	var newuser={   //用于给前端返回的数据
		UserAccount:req.body.UserAccount,
		UserRole:req.body.UserRole
	};
	if(userrole=="求职者"){
		var newApplicant={  //用于数据库的数据存储
			ApplicantAccount:req.body.UserAccount,
			ApplicantPassword:password,
			ApplicantActivationStatus:"0" ,
            ApplicantActivationCode:"",
            OnlineStatus:'0'
            //ApplicantResumeIDList:[]   //应聘者的简历列表；
		};
		Applicant.applicantSave(newApplicant,function(err){
            if(err){
                req.flash('error', err);
            	return res.redirect('/register');
            }
            req.session.user=newuser;
            req.flash('success', '注册成功');
            res.redirect('/');
		});
	}else if(userrole == "雇主"){
		var newEmployer={   //用于数据库的数据存储
			EmployerAccount:req.body.UserAccount,
			EmployerPassword:password,
			EmployerActivationStatus:"0",
            EmployerActivationCode:"",
            OnlineStatus:'0' ,
            EmployerHiringIDList:[]
		};
		Employer.employerSave(newEmployer,function(err){
            if(err){
                req.flash('error', err);
            	return res.redirect('/register');
            }
            req.session.user=newuser;
            req.flash('success', '注册成功');
            res.redirect('/');
		});
	}
});
app.get('/login',checkNotLogin);
app.get('/login',function(req, res) {
    res.render('login.html',{title:'用户登录',
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()});
});

app.post('/login',checkNotLogin);
app.post('/login',function(req, res) {
    //生成口令的散列值
    var md5=crypto.createHash('md5');
    var password=md5.update(req.body.UserPassword).digest('base64');
	var userAccount = req.body.UserAccount;
	var user;
	console.log("登录用户1"+userAccount)
    Applicant.applicantFind(userAccount,function(err,applicant){
        if(!applicant){ //求职者中无此用户
			Employer.employerFind(userAccount,function(err,employer){
				if(!employer){ //招聘者中无此用户
					req.flash('error','用户名不存在');
					//res.json({"statue":"2"}); //用户名不存在
					return res.redirect('/login');
				}
				else if (employer.EmployerPassword !== password){
					console.log(password);
					console.log(employer.EmployerPassword);
					req.flash('error','用户密码错误');
					//res.json({"statue":"3"}); 
					return res.redirect('/login');
				}
				else if (employer.EmployerActivationStatus =="0"){
					user={
						UserAccount:employer.EmployerAccount,
						UserRole:"雇主",
						UserStatus:employer.EmployerActivationStatus
					}
                    Employer.Online(userAccount,function(err){
                        if(!err){
                            req.session.user=user;
                            req.flash('success','登录成功,您的账号尚未激活');
                            return res.redirect('/');
                        }
                    })
					/*req.session.user=user;
					req.flash('success','登录成功,您的账号尚未激活');
					//res.json({"statue":"1"});
					return res.redirect('/');   */
				}
				else{
					user={
						UserAccount:employer.EmployerAccount,
						UserRole:"雇主",
						UserStatus:employer.EmployerActivationStatus
					}
                    console.log("改变登录状态");
                    Employer.Online(userAccount,function(err){
                        if(!err){
                            req.session.user=user;
                            req.flash('success','登录成功');
                            return res.redirect('/');
                        }
                    })
				}
			});	   
        }
        else {
			if(applicant.ApplicantPassword!== password){
				console.log("登录用户3"+userAccount);
				req.flash('error','用户密码错误');
				//res.json({"statue":"3"});
				return res.redirect('/login');
			}
			else if(applicant.ApplicantActivationStatus == "0"){ 
				console.log("登录用户4"+userAccount);
				user={
					UserAccount:applicant.ApplicantAccount,
					UserRole:"求职者",
					UserStatus:applicant.ApplicantActivationStatus
				}
                Applicant.Online(userAccount,function(err){
                    if(!err){
                        req.session.user=user;
                        req.flash('success','登录成功');
                        return res.redirect('/');
                    }
                })
			//	req.session.user=user;
				//res.json({"statue":"1"});
			//	req.flash('success','登录成功，账号尚未激活');
			//	return res.redirect('/');
			}
			else {
				user={
					UserAccount:applicant.ApplicantAccount,
					UserRole:"求职者",
					UserStatus:applicant.ApplicantActivationStatus
				}
                Applicant.Online(userAccount,function(err){
                    if(!err){
                        req.session.user=user;
                        req.flash('success','登录成功');
                        return res.redirect('/');
                    }
                })
			//	req.session.user=user;
				//res.json({"statue":"0"});
			//	req.flash('success','登录成功');
			//	res.redirect('/');
			}
		}
    });
});  

app.get('/resumecreate',checkLogin)
app.get('/resumecreate',function(req,res){
	res.render('resumecreate.html',{title:'创建简历',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()});
});

app.post('/resumename_check',function(req,res){
   // console.log("测试");
    var ApplicantAccount = req.session.user.UserAccount;
    var ResumeName = req.body.ResumeName;
    Applicant.applicantFind(ApplicantAccount,function(err,applicant){
        if(!err){
            var ApplicantID = applicant._id;
            Resumes.applicantResumeFindOne(ApplicantID,ResumeName,function(err,resume){
                if(!err){
                  //  console.log("查找到的简历"+resume);
                    if(resume){
                       // console.log("查找到的简历"+resume);
                         res.json({"flag":"1"});
                    }else {
                        //console.log("不存在");
                         res.json({"flag":"0"});
                    }
                }else {
                req.flash('error',err);
                return res.redirect('/manage') ;
                }
            })
        }else{
            req.flash('error',err);
            return res.redirect('/manage') ;
        }
    })
})
app.post('/resumecreate',checkLogin)
app.post('/resumecreate',function(req,res){
    var tmp_path = req.files.ContactIconURL.path;
    console.log(tmp_path);
    var target_path = 'images/'+req.files.ContactIconURL.name;
    console.log(target_path);
    fs.rename(tmp_path,"./public/"+target_path,function(err){
        if(err) throw err;
        fs.unlink(tmp_path,function(){
            if(err) throw err;
        })
    }) ;
	console.log(req.session.user);
	var applicantaccount = req.session.user.UserAccount;
	var ResumeName = req.body.ResumeName;
	var ResumeApplicantContactInfo={
		ApplicantName :req.body.ApplicantName,
		ContactMobilePhoneNo : req.body.ContactMobilePhoneNo,
        ContactFixedPhoneNo :  req.body.ContactFixedPhoneNo,
		ContactEmailNo :req.body.ContactEmailNo,
        ContactIconURL:target_path.toString(),
        ContactAddressAndZipCode: req.body. ContactAddressAndZipCode
	};
	var ResumeSummary = req.body.ApplicantSummary;
	var ResumeDetails = req.body.ApplicantDetail;
	
	Applicant.applicantFind(applicantaccount,function(err,applicant){
		if(!err){
			if(applicant){
                var ApplicantID = applicant._id;
				//console.log(applicant._id);
				//console.log(ResumeName+ResumeApplicantContactInfo+ResumeSummary+ResumeDetails);
				var Resume = {
					ApplicantID : ApplicantID,
					ResumeName :ResumeName,
					ResumeApplicantContactInfo : ResumeApplicantContactInfo,
					ResumeSummary : ResumeSummary,
					ResumeDetails :ResumeDetails
				};
				Resumes.resumeSave(Resume,function(err){    //保存简历到总的简历数据库
					if(err){
						req.flash('error', err);
						return res.redirect('/resumecreate');
					}
                    //将简历添加到用户的简历列表
                    Resumes.applicantResumeFindOne(ApplicantID,ResumeName,function(err,resume){
                        if(!err){
                            var ResumeID = resume._id;
                            Applicant.addResumeID(ApplicantID,ResumeID,function(err){
                                if(err){
                                    Resume.resumeDelete(ResumeID,function(err){
                                        if(!err){
                                            req.flash('error', err);
                                            res.redirect('/manage');
                                        }
                                    })
                                }
                                console.log("添加简历到用户简历列表");
                                req.flash('success', '成功创建简历');
                                res.redirect('/manage');
                            })
                        }
                    })

				});
			}
		}
	});
});

app.get('/hiringcreate',checkLogin);
app.get('/hiringcreate',function(req, res) {
    res.render('hiringcreate.html',{title:'发布职位',
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()});
});

app.post('/hiringname_check',function(req,res){
        // console.log("测试");
        var EmployerAccount = req.session.user.UserAccount;
        var HiringPositionName = req.body.HiringPositionName;
        Employer.employerFind(EmployerAccount,function(err,employer){
            if(!err){
                var EmployerID = employer._id;
                Hirings.employerHiringFindOne(EmployerID,HiringPositionName,function(err,hiring){
                    if(!err){
                        if(hiring){
                            res.json({"flag":"1"});
                        }else {
                            res.json({"flag":"0"});   //不存在
                        }
                    }else {
                        req.flash('error',err);
                        return res.redirect('/manage') ;
                    }
                })
            }else{
                req.flash('error',err);
                return res.redirect('/manage') ;
            }
        })
})

app.post('/hiringcreate',checkLogin);
app.post('/hiringcreate',function(req, res) {
    var tmp_path = req.files.ContactIconURL.path;
    console.log(tmp_path);
    var target_path = 'images/'+req.files.ContactIconURL.name;
    console.log(target_path);
    fs.rename(tmp_path,"./public/"+target_path,function(err){
        if(err) throw err;
        fs.unlink(tmp_path,function(){
            if(err) throw err;
        })
    }) ;
	console.log(req.session.user);
	var employeraccount = req.session.user.UserAccount;
	var HiringPositionName = req.body.HiringPositionName;
	var HiringEmployerContactInfo={
		EmployerName :req.body.EmployerName,
        ContactMobilePhoneNo : req.body.ContactMobilePhoneNo,
        ContactFixedPhoneNo :  req.body.ContactFixedPhoneNo,
        ContactEmailNo :req.body.ContactEmailNo,
        ContactIconURL:target_path.toString(),
        ContactAddressAndZipCode: req.body. ContactAddressAndZipCode
	};
	var HiringEmployerIntro = req.body.HiringEmployerIntro;
	var HirngRequirements = req.body.HiringRequirements;
	
	Employer.employerFind(employeraccount,function(err,employer){
		if(!err){
			if(employer){
				console.log(employer._id);
                var  EmployerID = employer._id ;
				//console.log(ResumeName+ResumeApplicantContactInfo+ResumeSummary+ResumeDetails);
				var Hiring = {
					EmployerID :employer._id,
					HiringPositionName :HiringPositionName,
					HiringEmployerContactInfo : HiringEmployerContactInfo,
					HiringEmployerIntro : HiringEmployerIntro,
					HiringRequirements :HirngRequirements,
                    ApplicantResumeIDlist:[]
				};
				Hirings.hiringSave(Hiring,function(err){
					if(err){
						req.flash('error', err);
						return res.redirect('/resumecreate');
					}
                });
                Hirings.employerHiringFindOne(EmployerID, HiringPositionName,function(err,hiring){
                    if(!err){
                       console.log("创建职位后ID"+hiring._id);
                        var HiringID = hiring._id;
                       Employer.addHiringID(EmployerID,HiringID,function(err){
                           if(err){
                               Hiring.hiringDelete(HiringID,function(err){
                                   req.flash('error', err);
                                   return res.redirect('/resumecreate');
                               })
                           }
                               req.flash('success', '成功发布职位');
                               res.redirect('/manage');
                      })
                    }
                })

			}
		}
	});
});

app.get('/manage',checkLogin);
app.get('/manage',function(req, res) {
    var useraccount = req.session.user.UserAccount;
	var userrole = req.session.user.UserRole;
	console.log("后端获得用户角色："+ userrole);
	if(userrole == "求职者"){
		Applicant.applicantFind(useraccount,function(err,applicant){
			if(!err){
				var ApplicantID = applicant._id;
				//console.log("待查找的用户的ID:"+ApplicantID);
				Resumes.applicantResumeFind(ApplicantID,function(err,applicantresumes){
					if(!err){
					console.log("applicantresumes:"+applicantresumes);
					res.render('manage.html',{title:'简历管理',
						user:req.session.user,
						resumes:applicantresumes,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()});
					}
				});
			}
		});
	}
	if(userrole == "雇主"){
		Employer.employerFind(useraccount,function(err,employer){
			if(!err){
				var EmployerID = employer._id;
				console.log("待查找的用户的ID:"+EmployerID);
				Hirings.employerHiringFind(EmployerID,function(err,employerhirings){
					if(!err){
					console.log("employerhirings:"+employerhirings);
					res.render('manage.html',{title:'职位管理',
						user:req.session.user,
						hirings:employerhirings,
						success:req.flash('success').toString(),
						error:req.flash('error').toString()});
					}
				});
			}
		});
	}	
});

app.get('/resumechange/:ResumeID',checkLogin);
app.get('/resumechange/:ResumeID',function(req, res) {
	var applicantaccount = req.session.user.UserAccount;
	//var ResumeName = req.params.ResumeName;
	var ResumeID =  ObjectID(req.params.ResumeID);
	Applicant.applicantFind(applicantaccount,function(err,applicant){
		if(!err){
			var ApplicantID = applicant._id;
			Resumes.resumeFindByID(ResumeID,function(err,resume){
			//console.log("查找到的简历信息--详情:"+resume.ResumeDetails);
				if(!err){
				//console.log(resume);
			//	console.log(resume.ResumeName+resume.ApplicantID+resume._id);
				res.render('resumechange.html',{title:'修改简历',
				user:req.session.user,
				resume:resume,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()});
				}
			});
		}
	});
	
});

app.post('/resumechange',checkLogin);
app.post('/resumechange',function(req, res) {
	console.log(req.session.user);
	var applicantaccount = req.session.user.UserAccount;
	console.log( req.body.ResumeID);
    Applicant.applicantFind(applicantaccount,function(err,applicant){
        if(!err)
        Resumes.resumeFindByID(ObjectID(req.body.ResumeID),function(err,resume){
        if(!err){
	    var updateResume = {
		    ApplicantID :applicant._id,
		    ResumeName : req.body.ResumeName,
		    ResumeApplicantContactInfo:{
                ContactMobilePhoneNo : req.body.ContactMobilePhoneNo,
                ContactFixedPhoneNo :  req.body.ContactFixedPhoneNo,
                ContactEmailNo :req.body.ContactEmailNo,
                ContactIconURL:resume.ResumeApplicantContactInfo.ContactIconURL,
                ContactAddressAndZipCode: req.body. ContactAddressAndZipCode
		    },
		    ResumeSummary : req.body.ResumeSummary,
		    ResumeDetails : req.body.ResumeDetail ,
            _id :ObjectID(req.body.ResumeID)
	 };
	        console.log("更改后的简历名称:"+updateResume.ResumeName);
        Resumes.resumeSave(updateResume,function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/manage');
            }
            //req.session.user=newuser;
            req.flash('success', '成功修改简历');
            res.redirect('/manage');
          });
        }
        })
    });
});

app.get('/hiringchange/:HiringID',checkLogin);
app.get('/hiringchange/:HiringID',function(req, res) {
	var employeraccount = req.session.user.UserAccount;
	var HiringID = ObjectID(req.params.HiringID);
	Employer.employerFind(employeraccount,function(err,employer){
		if(!err){
			var EmployerID = employer._id;
			Hirings.hiringFindByID(HiringID,function(err,hiring){
				if(!err){
				res.render('hiringchange.html',{title:'更新职位',
				user:req.session.user,
				hiring:hiring,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()});
				}
			});
		}
	});
	
});

app.post('/hiringchange',checkLogin);
app.post('/hiringchange',function(req, res) {
   /* var tmp_path = req.files.ContactIconURL.path;
    console.log(tmp_path);
    var target_path = 'images/'+req.files.ContactIconURL.name;
    console.log(target_path);
    fs.rename(tmp_path,"./public/"+target_path,function(err){
        if(err) throw err;
        fs.unlink(tmp_path,function(){
            if(err) throw err;
        })
    }) ; */
    var employeraccount = req.session.user.UserAccount;
    Employer.employerFind(employeraccount,function(err,employer){
        if(!err)
           Hirings.hiringFindByID(ObjectID(req.body.HiringID),function(err,hiring){
               if(!err){
            var updateHiring = {
                _id : ObjectID(req.body.HiringID),
                EmployerID : employer._id,
                HiringPositionName : req.body. HiringPositionName,
                HiringEmployerContactInfo:{
                    EmployerName :req.body.EmployerName,
                    ContactMobilePhoneNo : req.body.ContactMobilePhoneNo,
                    ContactFixedPhoneNo :  req.body.ContactFixedPhoneNo,
                    ContactEmailNo :req.body.ContactEmailNo,
                    ContactIconURL:hiring.HiringEmployerContactInfo.ContactIconURL,
                    ContactAddressAndZipCode: req.body. ContactAddressAndZipCode
                },
                HiringEmployerIntro : req.body.HiringEmployerIntro,
                HiringRequirements : req.body.HiringRequirements
            };
        Hirings.hiringSave(updateHiring,function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/manage');
            }
            req.flash('success', '成功修改职位');
            res.redirect('/manage');
        });
        }
        })
    });
});

app.get('/viewresume/:ResumeID',checkLogin)
app.get('/viewresume/:ResumeID',function(req,res){
    ResumeID=ObjectID(req.params.ResumeID);
    console.log("要查看的简历"+ResumeID);
    Resumes.resumeFindByID(ResumeID,function(err,resume){
        if(!err){
            var ApplicantID = resume. ApplicantID;
            Applicant.applicantFindByID( ApplicantID,function(err,applicant){
                if(!err){
                     res.render('viewresume.html',{
                         title:'职位详细信息',
                         user:req.session.user,
                         resume:resume,
                         applicant:applicant,
                         success:req.flash('success').toString(),
                         error:req.flash('error').toString()
                     })
                 }
            });
        }
    })
})
app.get('/viewhiring/:HiringID',checkLogin)
app.get('/viewhiring/:HiringID',function(req,res){
   var HiringID =ObjectID(req.params.HiringID);
   Hirings.hiringFindByID( HiringID,function(err,hiring){
       if(!err){
          var EmployerID = hiring.EmployerID;
          Employer.employerFindByID(EmployerID,function(err,employer){
          if(!err){
              console.log("职位发布人ID"+employer._id);
              res.render('viewhiring.html',{
              title:'职位详细信息',
               user:req.session.user,
               hiring:hiring,
               employer:employer,
               success:req.flash('success').toString(),
               error:req.flash('error').toString()
               })
              console.log("要查看的职位信息"+hiring);
                 }
            });
       }
    })
})


app.get("/delete/:ID",checkLogin);
app.get('/delete/:ID',function(req,res){
    var userrole =  req.session.user.UserRole;
    var userAccount = req.session.user.UserAccount;
    if(userrole == '求职者'){
        var resumeID = req.params.ID;
        Resumes.resumeDelete(resumeID,userAccount,function(err){
            if(!err){
                res.redirect('/manage');
            }
        })
    }  else if (userrole == '雇主'){
        var hiringID = req.params.ID;
        Hirings.hiringDelete(hiringID,userAccount,function(err){
            if(!err){
                res.redirect('/manage');
            }
        })
    }
});
//验证被请求者是否在线，建立面试链接
app.post("/interview_apply",checkLogin);
app.post("/interview_apply",function(req,res){
    console.log("建立面试链接") ;
    var user =req.session.user;
    console.log(user);
    if(user.UserRole == "求职者"){
        var HiringID = ObjectID(req.body.DocumentID);
        var EmployerID =ObjectID( req.body.AccepterID);
       // console.log("面试：待验证状态的雇主"+EmployerID)   ;
        Employer.employerFindByID(EmployerID,function(err,employer){
            console.log(employer.OnlineStatus);
            if(!err){
                if(employer.OnlineStatus == "0"){
                    res.json({"status":"0"});
                   // req.flash('error', err);
                }
                else{
                    res.json({"status":"1"});
                }
            }
        })
    }
    else if(user.UserRole == "雇主"){
        var ApplicantID =ObjectID( req.body.AccepterID);
        //console.log("面试：待验证状态的求职者"+ApplicantID);
        Applicant.applicantFindByID(ApplicantID,function(err,applicant){
            console.log(applicant.OnlineStatus);
            if(!err){
                if(applicant.OnlineStatus == "0"){
                    res.json({"status":"0"});
                    // req.flash('error', err);
                }
                else{
                    res.json({"status":"1"});
                }
            }
        })
    }
})
//跳转到面试页面，开始面试
//app.get("/startinterview",checkLogin);
app.get("/startinterview",function(req,res){
   // console.log("开始面试");
    res.render('interviewroom.html',{
        title:'面试室',
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
    })
})

//用户提交投递简历请求后，返回用户的简历列表
app.post("/select_resume",checkLogin);
app.post("/select_resume",function(req,res){

})
app.post("/haveresume",checkLogin);
app.post("/haveresume",function(req,res){
    var HiringID =ObjectID(req.body.DocumentID);
   // console.log("投递简历"+HiringID);
    var ApplicantAccount=req.session.user.UserAccount;
    Applicant.applicantFind(ApplicantAccount,function(err,applicant){
        if(!err){
            if(applicant.ApplicantResumeIDList.length == 0){
                console.log("求职者用户列表"+applicant.ApplicantResumeIDList);
                res.json({"status":"0"}); //还没有创建简历
            }else{
                console.log("求职者用户列表1111"+applicant.ApplicantResumeIDList);
            var ResumeID = applicant.ApplicantResumeIDList[0];
            Resumes.addApplyhiringID(ResumeID,HiringID,function(err){
                if(!err){
                 // console.log("要投递的简历ID："+ResumeID);
                     Hirings.addApplicantResumeID(ResumeID,HiringID,function(err){
                     if(!err){
                         res.json({"status":"1"});
                     }
                     })
                 }
             })
            }
        }
    })
})
//个人中心

    app.get('/personalcenter',checkLogin);
    app.get('/personalcenter',function(req, res) {
        var UserAccount = req.session.user.UserAccount;
        var UserRole = req.session.user.UserRole;
        if(UserRole == "雇主"){
            Employer.employerFind(UserAccount,function(err,employer){
                if(!err) {
                    var employerID = employer._id;
                    Hirings.employerHiringFind(employerID,function(err,employerhirings){
                        if(!err){
                        res.render("personalcenter.html",
                            {title:'个人中心',
                                user:req.session.user,
                                employerhirings:employerhirings,
                                success:req.flash('success').toString(),
                                error:req.flash('error').toString()
                            }
                        )
                        }
                    })
                }
            })
        }else{res.render("personalcenter.html",
            {title:'个人中心',
                user:req.session.user,
                applicantresumelist:null,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            }
        )}
    })

app.get('/viewhaveresumelist/:HiringID',checkLogin)
app.get('/viewhaveresumelist/:HiringID',function(req,res){
   var HiringID=ObjectID(req.params.HiringID);
    console.log("req.params.HiringID:"+HiringID)
    Hirings.applicantresumeFind(HiringID,function(err,applyresumes){ //////////待改
        console.log("某职位的投递简历:"+applyresumes)
         if(!err) {
             res.render("haveresumelist.html",
                 {title:'个人中心',
                     user:req.session.user,
                     applicantresumelist:applyresumes,
                     success:req.flash('success').toString(),
                     error:req.flash('error').toString()
                 }
             )
         }
    })
})
app.get('/logout',checkLogin);
app.get('/logout',function(req, res) {
    var user=req.session.user;
    if(user.UserRole=="求职者") {
        Applicant.Outline(user.UserAccount,function(err){
            if(!err){
                req.session.user=null;
                req.flash('success','登出成功');
                return res.redirect('/');
            }
        })
    }
    if(user.UserRole=="雇主") {
        console.log("更改雇主状态");
        Employer.Outline(user.UserAccount,function(err){
            if(!err){
                req.session.user=null;
                req.flash('success','登出成功');
                return res.redirect('/');
            }
        })
    }
});


function checkLogin(req,res,next){
    if(!req.session.user){
        req.flash('error','未登录');
        return res.redirect('/login');
    }
    next();
}
function checkNotLogin(req,res,next){
    if(req.session.user){
        req.flash('error','已登录');
        return res.redirect('/');
    }
    next();
}
}