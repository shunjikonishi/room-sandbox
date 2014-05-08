import play.api.GlobalSettings
import play.api.mvc._

object Global extends GlobalSettings {
  
  override def onRouteRequest(req: RequestHeader): Option[Handler] = {
    if (req.method == "GET" &&
        req.headers.get("Upgrade").exists(_.equalsIgnoreCase("websocket"))) {
      Some(controllers.Application.ws(req.path))
    } else {
      super.onRouteRequest(req)
    }
  }

}
