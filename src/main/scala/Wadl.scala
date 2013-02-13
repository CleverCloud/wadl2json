package com.rbelouin.wadl2json

import com.codecommit.antixml._

import dispatch._

import scalaz._
import scalaz.effect._
import Scalaz._

object Wadl {
  private def res2string(r: com.ning.http.client.Response) =
    Option(r).filter(_.getStatusCode < 300).toSuccess("Error: Invalid response: %s %s\n%s".format(r.getStatusCode, r.getStatusText, r.getResponseBody)).map(_.getResponseBody)
  private def res2xml(r: com.ning.http.client.Response) = for {
    str <- res2string(r)
    xml <- XML.fromString(str).pure[IO].catchLeft.unsafePerformIO.fold(e => Failure(e.getMessage), Success(_))
  } yield xml

  def fromUrl(u: String): Validation[String,Elem] = {
    val x = Http(url(u) > (r => res2xml(r)))()
    Http.shutdown
    x
  }
}
