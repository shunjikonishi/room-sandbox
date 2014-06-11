package controllers

import play.api._
import play.api.mvc._
import roomframework.room.Room
import roomframework.room.RoomHandler
import roomframework.room.RoomManager
import roomframework.room.DefaultRoomFactory

object Application extends Controller {

  def notFound(path: String) = Action {
    NotFound(views.html.index(path))
  }

  val rm = RoomManager(new DefaultRoomFactory() {
    override def createHandler(room: Room) = new SandboxRoomHandler(room)
  })

  def ws(path: String) = WebSocket.using[String] { implicit request =>
    val origin = request.headers("origin")
    Logger.info("Start connection: " + origin + path)
    Logger.info("Remote address: " + request.remoteAddress)
    Logger.info("Headers: " + request.headers)
    val h = rm.join(path)
    h match {
      case x: SandboxRoomHandler => 
        x.path = Some(path)
        x.origin = Some(origin)
      case _ =>
    }
    (h.in, h.out)
  }

  class SandboxRoomHandler(room: Room) extends RoomHandler(room) {
    var path: Option[String] = None
    var origin: Option[String] = None
    override protected def handleMessage(msg: String): Unit = {
      Logger.info(path.get + ": " + msg)
      room.channel.send(msg)
    }
    override protected def onDisconnect: Unit = {
      Logger.info("End conntion: " + origin.get + path.get)
    }
  }
}