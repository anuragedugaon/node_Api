class AutoGenerate {
    AutoGenerate({
       this.status,
       this.success,
       this.message,
       this.post,
    });
   int ? status;
      bool? success ;
    String ? message;
       Post ? post;
    
    AutoGenerate.fromJson(Map<String, dynamic> json){
      status = json['status'];
      success = json['success'];
      message = json['message'];
      post = Post.fromJson(json['post']);
    }
  
    Map<String, dynamic> toJson() {
      final _data = <String, dynamic>{};
      _data['status'] = status;
      _data['success'] = success;
      _data['message'] = message;
      _data['post'] = post!.toJson();
      return _data;
    }
  }
  
  class Post {
    Post({
       this.id,
       this.title,
       this.description,
       this.user,
       this.createdAt,
       this.V,
       this.comments,
    });
    String ? id;
    String ? title;
    String ? description;
    User ? user;
    String ? createdAt;
   int ? V;
    List<Comments> ? comments;
    
    Post.fromJson(Map<String, dynamic> json){
          id = json['_id'];
      title = json['title'];
      description = json['description'];
      user = User.fromJson(json['user']);
      createdAt = json['createdAt'];
        V = json['__v'];
      comments = List.from(json['comments']).map((e)=>Comments.fromJson(e)).toList();
    }
  
    Map<String, dynamic> toJson() {
      final _data = <String, dynamic>{};
      _data['_id'] = id;
      _data['title'] = title;
      _data['description'] = description;
      _data['user'] = user?.toJson();
      _data['createdAt'] = createdAt;
      _data['__v'] = V;
      _data['comments'] = comments?.map((e)=>e.toJson()).toList();
      return _data;
    }
  }
  
  class User {
    User({
       this.id,
       this.name,
       this.email,
    });
    String ? id;
    String ? name;
    String ? email;
    
    User.fromJson(Map<String, dynamic> json){
      id = json['_id'];
      name = json['name'];
      email = json['email'];
    }
  
    Map<String, dynamic> toJson() {
      final _data = <String, dynamic>{};
      _data['_id'] = id;
      _data['name'] = name;
      _data['email'] = email;
      return _data;
    }
  }
  
  class Comments {
    Comments({
       this.id,
       this.content,
       this.post,
       this.user,
       this.replies,
       this.createdAt,
    });
    String ? id;
    String ? content;
    String ? post;
     User? user;    
    List<Replies>?replies;
    String ? createdAt;
   int ? _V;
    
    Comments.fromJson(Map<String, dynamic> json){
      id = json['_id'];
      content = json['content'];
      post = json['post'];
      user = User.fromJson(json['user']);
      replies = List.from(json['replies']).map((e)=>Replies.fromJson(e)).toList();
      createdAt = json['createdAt'];
      _V = json['__v'];
    }
  
    Map<String, dynamic> toJson() {
      final _data = <String, dynamic>{};
      _data['_id'] = id;
      _data['content'] = content;
      _data['post'] = post;
      _data['user'] = user?.toJson();
      _data['replies'] = replies?.map((e)=>e.toJson()).toList();
      _data['createdAt'] = createdAt;
      _data['__v'] = _V;
      return _data;
    }
  }
  
  class Replies {
    Replies({
       this.content,
       this.user,
       this.id,
       this.createdAt,
    });
    String ? content;
    User ? user;
    String ? id;
    String ? createdAt;
    
    Replies.fromJson(Map<String, dynamic> json){
      content = json['content'];
      user = User.fromJson(json['user']);
      id = json['_id'];
      createdAt = json['createdAt'];
    }
  
    Map<String, dynamic> toJson() {
      final _data = <String, dynamic>{};
      _data['content'] = content;
      _data['user'] = user?.toJson();
      _data['_id'] = id;
      _data['createdAt'] = createdAt;
      return _data;
    }
  }