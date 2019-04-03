package polaris.kafka.websocket

import com.google.gson.Gson
import org.apache.avro.specific.SpecificRecord
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.kstream.KStream
import org.apache.kafka.streams.kstream.Transformer
import org.apache.kafka.streams.kstream.TransformerSupplier
import org.apache.kafka.streams.processor.ProcessorContext
import polaris.kafka.SafeTopic
import polaris.kafka.actionrouter.ActionValue
import polaris.kafka.actionrouter.ActionKey
import java.nio.ByteBuffer

val gson = Gson()

const val REPLYPATH_HEADER = "polaris-kafka-replyPath"

class TrackAndTransformToAction : Transformer<WebsocketEventKey?, WebsocketEventValue?, KeyValue<ActionKey?, ActionValue?>> {
    private var context : ProcessorContext? = null

    override fun init(context : ProcessorContext?) {
        println("TrackAndTransformToAction.init() called")
        this.context = context
    }

    override fun transform(key : WebsocketEventKey?, value : WebsocketEventValue?) : KeyValue<ActionKey?, ActionValue?> {
        println("TrackAndTransformToAction.transform() called")
        return if (key != null && value != null) {

            val actionKey = ActionKey(
                value.getPrincipal()
            )
            val actionValue =
                gson.fromJson(value.getData(), ActionValue::class.java)

            // Set headers
            //
            if (value.getReplyPath() != null) {
                context?.headers()?.add(REPLYPATH_HEADER, value.getReplyPath().toByteBuffer().array())
            }

            KeyValue(actionKey, actionValue)
        } else {
            KeyValue(null, null)
        }
    }

    override fun close() {
        println("TrackAndTransformToAction.close() called")
    }
}

class TrackAndTransformFromAction (private val cast : CAST) : Transformer<ActionKey?, ActionValue?, KeyValue<WebsocketEventKey?, WebsocketEventValue?>> {
    private var context : ProcessorContext? = null

    override fun init(context : ProcessorContext?) {
        println("TrackAndTransformFromAction.init() called")
        this.context = context
    }

    override fun transform(key : ActionKey?, value : ActionValue?) : KeyValue<WebsocketEventKey?, WebsocketEventValue?> {
        println("TrackAndTransformFromAction.transform() called")
        return if (key != null && value != null) {

            // Grab the replyPath header and re-hydrate
            //
            val replyPathHeader = context?.headers()?.firstOrNull { header -> header.key() == REPLYPATH_HEADER }
            return if (replyPathHeader != null) {
                val replyPath = ReplyPath.fromByteBuffer(ByteBuffer.wrap(replyPathHeader.value()))

                val websocketEventKey = WebsocketEventKey(replyPath.getId())
                val websocketEventValue = WebsocketEventValue(replyPath.getId(), cast.name, key.getPrinciple(), replyPath, gson.toJson(value))

                KeyValue(websocketEventKey, websocketEventValue)
            }
            else {
                // Can't really route a record with no reply path
                //
                KeyValue(null, null)
            }
        } else {
            KeyValue(null, null)
        }
    }

    override fun close() {
        println("TrackAndTransformFromAction.close() called")
    }
}

fun RouteFromTopicTo (
    topic : SafeTopic<WebsocketEventKey, WebsocketEventValue>,
    matchResource : String,
    matchAction : String,
    from : KStream<ActionKey, ActionValue>,
    cast : CAST = CAST.UNICAST) {

    from
        .filter { key, value ->
            value?.getResource() == matchResource && value.getAction() == matchAction
        }
        .transform(TransformerSupplier<ActionKey?, ActionValue?, KeyValue<WebsocketEventKey?, WebsocketEventValue?>>{
            TrackAndTransformFromAction(cast)
        })
        .filter { key, value -> key != null && value != null }
        .map { key, value -> KeyValue(key!!, value!!) }
        .to(topic.topic, topic.producedWith())
}

fun RouteToTopicFrom (
    from : KStream<WebsocketEventKey, WebsocketEventValue>,
    matchResource : String,
    matchAction : String,
    topic : SafeTopic<ActionKey, ActionValue>) {

    from
        .filter { _, value ->
            if (value.getData() == null) {
                println("Cannot route with empty payload")
            }
            value.getData() != null
        }
        .transform (TransformerSupplier<WebsocketEventKey?, WebsocketEventValue?, KeyValue<ActionKey?, ActionValue?>> {
            TrackAndTransformToAction()
        })
        .filter { _, value ->
            value?.getResource() == matchResource && value.getAction() == matchAction
        }
        .map { key, value ->
            KeyValue(key!!, value!!)
        }
        .to(topic.topic, topic.producedWith())
}