/**
 * Created with JetBrains WebStorm.
 * User: Datlb
 * Date: 13-4-7
 * Time: 下午5:08
 * To change this template use File | Settings | File Templates.
 */

var mongproject = require('./MongoDB/dbc.js');


exports.projectSave=function(project,callback){
    mongproject.CAdd('project',project,function(err){
        if(err){
            return callback(err);
        }
        callback(null);
    });
};

exports.ProjectFind=function(ProjectName,callback){
    mongproject.CFindByName('project',ProjectName,function(err,doc){
        if(err){
            return callback(err,null);
        }
        callback(null,doc);
    });
};


exports.userprojectFind=function(userName,callback){
    mongproject.find({userName:userName}).sort('-_id').exec(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var projects=[];
        docs.forEach(function(doc)
        {
            var project=new Projects(doc.userName,doc.ProjectName,doc.ProjectDescription,doc.ProjectStatus,doc.Timestamp,doc.ProjectExpectedFundingMoney,doc.ProjectFundingTimeLeft,doc.ProjectAccountSummary);

            projects.push(project);
        });
        callback(null,projects);
    })
};

var allprojectFind=exports.allprojectFind=function(callback){
    Project.find().sort('-_id').exec(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var projects=[];
        docs.forEach(function(doc)
        {
            var project=new Projects(doc.userName,doc.ProjectName,doc.ProjectDescription,doc.ProjectStatus,doc.Timestamp,doc.ProjectExpectedFundingMoney,doc.ProjectFundingTimeLeft,doc.ProjectAccountSummary);
            projects.push(project);
        });
        callback(null,projects);
    })
};

///////////////////////////////////////////
exports.projectcommentSave = function(comments,callback){
    var Id = comments.projectId;
    var name = comments.user.UserName;
    var comment = comments.comment;
    Project.findOne({_id:Id},function(err,project){
        if (err){
            return callback(err);
        }
        var procomment = {
            Time           : Date.now(),
            userName       : name,
            projectComment : comment
        }

        project.ProjectCommentsList.push(procomment);
        project.save(function(err){
            if(err){
                return  callback(err);
            }
            callback(null);
        })
        console.log("项目评论："+project.ProjectCommentsList);
    });
};
//////////////////////////////////////////////////////////////////
//ProjectFundingList:[{Time:Date,userName:String,fundingMoney:String}],
//ProjectAccountSummary:{type:String,default:0}
exports.projectfundingSave = function(funding,callback){
    var name = funding.user.UserName;
    var projectName = funding.projectname;
    var projectId = funding.projectId;
    var money = funding.fundedmoney;
    Project.findOne({_id:projectId},function(err,project){
        if (err){
            return callback(err);
        }
        var projectfund = {
            Time          : Date.now(),
            userName      : name,
            fundingMoney  : money
        }
        project.ProjectFundingList.push(projectfund);
        project.ProjectAccountSummary =String(Number(money)+Number(project.ProjectAccountSummary));
        //if(project.ProjectAccountSummary >= project.ProjectExpectedFundingMoney){
        //	project.ProjectStatus=" 融资成功";
        //}
        project.save(function(err){
            if(err){
                return  callback(err);
            }
            callback(null);
        });
        console.log("赞助人列表："+project.ProjectFundingList);
        console.log("集资总额："+project.ProjectAccountSummary);
    });
};

////////////////////////////////////////////////////////////////////////////
var projectFind=exports.projectFind=function(name,callback){
    Project.findOne({ProjectName:name},function(err,doc){
        if(err){
            return callback(err,null);
        }
        callback(null,doc);
    });
};
var projectFindById=exports.projectFindById=function(ID,callback){
    Project.findOne({_id:ID},function(err,doc){
        if(err){
            return callback(err,null);
        }
        callback(null,doc);
    });
};
////////////////////////////////////////////////////////////////////
var backfundmoney=exports.backfundmoney=function(project,callback){
    console.log(project.ProjectName+"的赞助人列表:"+project.ProjectFundingList);////
    project.ProjectFundingList.forEach(function(item){
        var money=item.fundingMoney;
        var name = item.userName;
        console.log("ITEM"+name);

        User.userFind(name,function(err,user){
            console.log("ITEM1111");
            if(err){
                return callback(err);
            }
            console.log("返还之前赞助人账户的余额:"+user.UserAccountSummary);///////
            user.UserAccountSummary=String(Number(user.UserAccountSummary)+Number(money));
            user.save(function(err){
                if(err){
                    return  callback(err);
                }
                callback(null);
            });
            console.log("返还之后赞助人账户的余额:"+user.UserAccountSummary);////////
        });
    });
    project.ProjectAccountSummary="0";
    project.save(function(err){
        if(err){
            return callback(err);
        }
        callback(null);
    });
    console.log(project.ProjectName+"项目总额归零："+project.ProjectAccountSummary);
};
exports.changestatus=function(name,callback){
    Project.findOne({ProjectName:name},function(err,doc){
        if(err){
            return callback(err,null);
        }
        var different=Number(doc.ProjectAccountSummary) - Number(doc.ProjectExpectedFundingMoney);
        //console.log("集资得到："+Number(doc.ProjectAccountSummary));
        //console.log("预期得到："+Number(doc.ProjectExpectedFundingMoney));
        //console.log("差值"+different);
        //console.log("融资前的状态："+doc.ProjectStatus);
        if(different < 0 ){
            //console.log("差值"+different);
            if(doc.ProjectStatus!="融资失败"){
                doc.ProjectStatus="融资失败";
                exports.backfundmoney(doc,function(err){
                    if(err){
                        callback(err,null);
                    }
                });
            }
        }
        else{
            doc.ProjectStatus="融资成功";
        }
        doc.save(function(err){
            if(err){
                return  callback(err,null);
            }
            callback(null,doc);
        });
        console.log(doc.ProjectName+doc.ProjectStatus);
    });
    console.log("状态已更改");

};

//总页数
exports.getTotalPage=function(pageNum,callback){
    Project.count({"ProjectStatus":"正在融资"},function(err,count){
        var totalNum;
        //console.log(count);
        if(err){
            return callback(err,null);
        }
        totalNum= Math.ceil(count/pageNum);
        console.log("totalNum:"+totalNum);
        callback(null,totalNum);
    });
};
//每页显示的数据
exports.getPageContent=function(pageNum,page,callback){
    //console.log(page+":"+pageNum);
    Project.find({"ProjectStatus":"正在融资"}).skip(pageNum*(page-1)).limit(pageNum).sort('-_id').exec(function(err,docs){
        if(err){
            return callback(err,null);
        }
        var content=[];
        docs.forEach(function(doc){
            content.push(doc);
        });
        callback(null,content);
    });
};
