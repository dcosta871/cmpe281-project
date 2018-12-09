process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
var expect = chai.expect;


chai.use(chaiHttp);
function get_buildings_test(){
  it('Got Building', function(done) {   
    chai.request('http://nodeloadbalancer-1594461647.us-west-2.elb.amazonaws.com:3000')
    .get('/buildings/SJSU1')
    .end(function(err, res) {
      expect(res).to.have.status(200);
      done();
    });
  });
}

function invalid_delete_test() {
  it('Delete cluster fails as expected', function(done) {   
    chai.request('http://nodeloadbalancer-1594461647.us-west-2.elb.amazonaws.com:3000')
    .delete('/buildings/FakeBuilding')
    .end(function(err, res) {
      expect(res).to.have.status(404);
      done();
    });
  });
}

for(var i = 0; i <= 29; i++){
  get_buildings_test();
}

for(var i = 0; i <= 29; i++) {
  invalid_delete_test();
}



